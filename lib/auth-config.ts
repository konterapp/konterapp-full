import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getUserRoles, getUserPermissions } from "./permissions";
import { resolveUserActiveCompany, UserCompanySummary } from "./company-access";
import { findOrCreateGoogleUser } from "./modules/auth/provisioning";

type SessionCompany = UserCompanySummary;

declare module "next-auth" {
  interface User {
    id: string;
    roles: string[];
    permissions: string[];
    activeCompanyUuid: string;
    companies: SessionCompany[];
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      roles: string[];
      permissions: string[];
      activeCompanyUuid: string;
      companies: SessionCompany[];
      impersonatorId?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    permissions: string[];
    activeCompanyUuid: string;
    companies: SessionCompany[];
    impersonatorId?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
            deletedAt: null,
          },
        });

        if (!user) return null;
        if (!user.isActive) return null;
        if (!user.emailVerifiedAt) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        let companyContext;
        try {
          companyContext = await resolveUserActiveCompany(user.id);
        } catch {
          return null;
        }

        const roles = await getUserRoles(user.id, companyContext.activeCompanyUuid);
        const permissions = await getUserPermissions(user.id, companyContext.activeCompanyUuid);

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          roles,
          permissions,
          activeCompanyUuid: companyContext.activeCompanyUuid,
          companies: companyContext.companies,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Email Google sudah terverifikasi, jadi aman untuk dipetakan ke
      // akun existing dengan email yang sama (misal hasil register password).
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const dbUser = await findOrCreateGoogleUser({
          email: profile.email,
          name: profile.name,
        });

        if (!dbUser.isActive) {
          throw new Error("Akun Anda tidak aktif");
        }

        token.id = String(dbUser.id);
        token.name = dbUser.name;
        token.email = dbUser.email;

        // User belum punya perusahaan (login Google pertama kali):
        // session kosong, middleware akan arahkan ke halaman onboarding
        // untuk input nama perusahaan sendiri.
        let companyContext;
        try {
          companyContext = await resolveUserActiveCompany(dbUser.id);
        } catch {
          token.roles = [];
          token.permissions = [];
          token.activeCompanyUuid = "";
          token.companies = [];
          return token;
        }

        token.roles = await getUserRoles(dbUser.id, companyContext.activeCompanyUuid);
        token.permissions = await getUserPermissions(dbUser.id, companyContext.activeCompanyUuid);
        token.activeCompanyUuid = companyContext.activeCompanyUuid;
        token.companies = companyContext.companies;
        return token;
      }

      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.activeCompanyUuid = user.activeCompanyUuid;
        token.companies = user.companies;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.roles = token.roles;
      session.user.permissions = token.permissions;
      session.user.activeCompanyUuid = token.activeCompanyUuid;
      session.user.companies = token.companies;
      session.user.impersonatorId = token.impersonatorId;
      return session;
    },
  },
});
