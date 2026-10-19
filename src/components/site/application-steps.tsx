import { Link } from '@tanstack/react-router'
import { COVERED_CITIES, type ApplicationType } from '@/lib/applications'
import type { ContactDraft, MotivationDraft, PrescreenDraft } from './application-draft'
import { CheckboxField, ChoiceField, TextAreaField, TextField } from '../shared/form-fields'

type Errors<T> = Partial<Record<keyof T, string>>

const YES_NO = [
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
]

const OTHER_CITY = 'Otra'

export function PrescreenStep({
  type,
  values,
  errors,
  onChange,
}: {
  type: ApplicationType
  values: PrescreenDraft
  errors: Errors<PrescreenDraft>
  onChange: (values: PrescreenDraft) => void
}) {
  const set = (key: keyof PrescreenDraft) => (value: string) =>
    onChange({ ...values, [key]: value })

  return (
    <div className="flex flex-col gap-7">
      <ChoiceField
        legend="¿Sos mayor de 18 años?"
        name="isAdult"
        options={YES_NO}
        value={values.isAdult}
        onChange={set('isAdult')}
        error={errors.isAdult}
      />
      <ChoiceField
        legend="¿En qué localidad vivís?"
        name="city"
        options={[...COVERED_CITIES, OTHER_CITY].map((city) => ({ value: city, label: city }))}
        value={values.city}
        onChange={set('city')}
        error={errors.city}
      />
      {values.city === OTHER_CITY ? (
        <TextField
          label="¿Cuál?"
          value={values.cityOther ?? ''}
          onChange={(event) => set('cityOther')(event.target.value)}
          error={errors.cityOther}
          autoComplete="address-level2"
        />
      ) : null}
      <ChoiceField
        legend="¿Dónde vivís?"
        name="housingType"
        options={[
          { value: 'house', label: 'Casa' },
          { value: 'apartment', label: 'Departamento' },
        ]}
        value={values.housingType}
        onChange={set('housingType')}
        error={errors.housingType}
      />
      <ChoiceField
        legend="¿Es propia o alquilada?"
        name="housingTenure"
        options={[
          { value: 'owned', label: 'Propia' },
          { value: 'rented', label: 'Alquilada' },
        ]}
        value={values.housingTenure}
        onChange={set('housingTenure')}
        error={errors.housingTenure}
      />
      {values.housingTenure === 'rented' ? (
        <ChoiceField
          legend="¿El contrato permite tener animales?"
          name="petsAllowed"
          options={[...YES_NO, { value: 'unknown', label: 'No sé' }]}
          value={values.petsAllowed}
          onChange={set('petsAllowed')}
          error={errors.petsAllowed}
        />
      ) : null}
      <ChoiceField
        legend="¿Tenés patio o un espacio cerrado, sin escapes?"
        name="fenced"
        options={YES_NO}
        value={values.fenced}
        onChange={set('fenced')}
        error={errors.fenced}
      />
      <ChoiceField
        legend="¿Tenés otros animales?"
        name="otherPets"
        options={[
          { value: 'none', label: 'No' },
          { value: 'neutered', label: 'Sí, castrados' },
          { value: 'not_neutered', label: 'Sí, sin castrar' },
        ]}
        value={values.otherPets}
        onChange={set('otherPets')}
        error={errors.otherPets}
      />
      {type === 'adoption' ? (
        <ChoiceField
          legend="Si es cachorro, ¿te comprometés a castrarlo a los 6 meses?"
          name="neuterCommitment"
          options={YES_NO}
          value={values.neuterCommitment}
          onChange={set('neuterCommitment')}
          error={errors.neuterCommitment}
        />
      ) : null}
      <ChoiceField
        legend="¿Aceptás que te escribamos después para saber cómo está?"
        name="acceptsFollowUp"
        options={YES_NO}
        value={values.acceptsFollowUp}
        onChange={set('acceptsFollowUp')}
        error={errors.acceptsFollowUp}
      />
    </div>
  )
}

export function ContactStep({
  values,
  errors,
  onChange,
}: {
  values: ContactDraft
  errors: Errors<ContactDraft>
  onChange: (values: ContactDraft) => void
}) {
  const set = (key: keyof ContactDraft) => (value: string) => onChange({ ...values, [key]: value })

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="Nombre"
          value={values.firstName ?? ''}
          onChange={(event) => set('firstName')(event.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <TextField
          label="Apellido"
          value={values.lastName ?? ''}
          onChange={(event) => set('lastName')(event.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>
      <TextField
        label="WhatsApp"
        hint="Te escribimos por acá."
        type="tel"
        inputMode="tel"
        value={values.whatsapp ?? ''}
        onChange={(event) => set('whatsapp')(event.target.value)}
        error={errors.whatsapp}
        autoComplete="tel"
      />
      <TextField
        label="Email (opcional)"
        type="email"
        value={values.email ?? ''}
        onChange={(event) => set('email')(event.target.value)}
        error={errors.email}
        autoComplete="email"
      />
      <TextAreaField
        label="¿Quiénes viven en la casa?"
        hint="Adultos, chicos y sus edades, y otros animales."
        value={values.household ?? ''}
        onChange={(event) => set('household')(event.target.value)}
        error={errors.household}
      />
      <ChoiceField
        legend="¿Cuántas horas por día estaría solo?"
        name="hoursAlone"
        options={[
          { value: 'under_4', label: 'Menos de 4' },
          { value: '4_to_8', label: 'De 4 a 8' },
          { value: 'over_8', label: 'Más de 8' },
        ]}
        value={values.hoursAlone}
        onChange={set('hoursAlone')}
        error={errors.hoursAlone}
      />
      <TextField
        label="En vacaciones, ¿quién lo cuidaría?"
        value={values.vacationCare ?? ''}
        onChange={(event) => set('vacationCare')(event.target.value)}
        error={errors.vacationCare}
      />
    </div>
  )
}

export function MotivationStep({
  type,
  values,
  errors,
  onChange,
}: {
  type: ApplicationType
  values: MotivationDraft
  errors: Errors<MotivationDraft>
  onChange: (values: MotivationDraft) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <TextAreaField
        label={type === 'adoption' ? '¿Por qué querés adoptar?' : '¿Por qué querés ser tránsito?'}
        rows={5}
        value={values.motivation ?? ''}
        onChange={(event) => onChange({ ...values, motivation: event.target.value })}
        error={errors.motivation}
      />
      <TextAreaField
        label="¿Tuviste animales antes? (opcional)"
        hint="Contanos cómo fue y qué pasó con ellos."
        value={values.experience ?? ''}
        onChange={(event) => onChange({ ...values, experience: event.target.value })}
        error={errors.experience}
      />
      <CheckboxField
        checked={values.consent ?? false}
        onChange={(consent) => onChange({ ...values, consent })}
        error={errors.consent}
      >
        Acepto que Funpabia guarde estos datos para evaluar mi solicitud y contactarme, según la{' '}
        <Link
          to="/privacidad"
          target="_blank"
          className="font-semibold text-primary underline underline-offset-4"
        >
          política de privacidad
        </Link>
        .
      </CheckboxField>
    </div>
  )
}
