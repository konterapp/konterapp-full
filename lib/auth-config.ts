import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getUserRoles, getUserPermissions } from "./permissions";
import { resolveUserActiveCompany, UserCompanySummary } from "./company-access";

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
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
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
