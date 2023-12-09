import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };