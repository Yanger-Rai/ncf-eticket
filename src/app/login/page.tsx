import LoginScreen from "@/components/LoginScreen";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { message?: string };
}) {
  return <LoginScreen message={searchParams?.message} />;
}
