import NextAuth from 'next-auth';
// IDE Refresh - Routing (Switching to relative to force re-index)
import { authOptions } from '../../../../lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
