interface FormErrorProps {
  id?: string;
  message?: string;
}

export function FormError({ id, message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-danger-600">
      {message}
    </p>
  );
}