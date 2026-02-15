// IDE Refresh - Authentication Configuration
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Demo Account',
            credentials: {
                email: { label: "Email", type: "text", placeholder: "user@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // For Phase 5 initial setup, we'll use a demo user
                if (credentials?.email === "admin@pdftoolkit.com" && credentials?.password === "admin123") {
                    return {
                        id: "1",
                        name: "Admin User",
                        email: "admin@pdftoolkit.com",
                        role: "admin",
                        isPro: true
                    };
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.isPro = (user as any).isPro;
                token.uploadLimit = (user as any).isPro ? 1073741824 : 10485760; // 1GB vs 10MB
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).isPro = token.isPro;
                (session.user as any).uploadLimit = token.uploadLimit;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/signin',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
