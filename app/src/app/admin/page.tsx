import { getDefaultSession } from '@/lib/auth';

export default function AdminPage() {
  const session = getDefaultSession();

  return (
    <section>
      <h1>Admin</h1>
      <p>Signed in as: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </section>
  );
}
