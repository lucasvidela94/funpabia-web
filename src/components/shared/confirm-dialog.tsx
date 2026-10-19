import { useState, type ComponentProps, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

// Asking before an action that is hard to undo. The confirm button names the action ("Cerrar la
// venta"), never a bare "Aceptar", and Cancel keeps the focus so Enter never confirms by accident.

type ConfirmCopy = {
  title: string
  description: ReactNode
  confirmLabel: string
  // Red confirm button, for deleting or discarding.
  destructive?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmCopy & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline" className="h-11 px-5 font-semibold">
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant={destructive ? 'destructive' : 'default'}
              className="h-11 px-5 font-bold"
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// A button that asks first. Takes the same props as Button, plus the dialog's copy.
export function ConfirmButton({
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  ...button
}: ConfirmCopy & Omit<ComponentProps<typeof Button>, 'onClick'>) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" {...button} onClick={() => setOpen(true)} />
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        destructive={destructive}
        onConfirm={onConfirm}
      />
    </>
  )
}
