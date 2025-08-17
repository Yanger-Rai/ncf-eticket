import LoginScreen from "@/components/LoginScreen";

export const dynamic = "force-dynamic";

// The component must be async to use await
export default async function LoginPage({
  searchParams,
}: {
  // The type for searchParams must be a Promise that resolves to the object
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // We must await the promise to get the actual search params object
  const resolvedSearchParams = await searchParams;

  const message = resolvedSearchParams?.message;

  // Ensure the message is a string, not an array
  const finalMessage = Array.isArray(message) ? message[0] : message;

  return <LoginScreen message={finalMessage} />;
}
