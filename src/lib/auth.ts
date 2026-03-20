import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values({
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        });
      } else {
        const dbUser = existing[0];
        if (dbUser.name !== user.name || dbUser.image !== user.image) {
          await db
            .update(users)
            .set({
              name: user.name ?? null,
              image: user.image ?? null,
              updatedAt: new Date(),
            })
            .where(eq(users.email, user.email));
        }
      }

      return true;
    },

    async jwt({ token, account }) {
      // account is only present on the initial sign-in
      if (account && token.email) {
        const dbUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, token.email))
          .limit(1);

        if (dbUser.length > 0) {
          token.userId = dbUser[0].id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId && typeof token.userId === 'string') {
        const dbUser = await db
          .select({
            id: users.id,
            subscriptionStatus: users.subscriptionStatus,
            freeTestsRemaining: users.freeTestsRemaining,
          })
          .from(users)
          .where(eq(users.id, token.userId))
          .limit(1);

        if (dbUser.length > 0) {
          session.user.id = dbUser[0].id;
          session.user.subscriptionStatus = dbUser[0].subscriptionStatus;
          session.user.freeTestsRemaining = dbUser[0].freeTestsRemaining;
        }
      }
      return session;
    },
  },
});
