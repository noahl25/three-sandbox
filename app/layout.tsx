import type { Metadata } from "next";
import Providers, { SessionProvider } from "@/providers/providers";
import "./globals.css";
import SignInPopup from "@/components/SignInPopup";
import SignInProvider from "@/components/SignInPopup";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export const metadata: Metadata = {
	title: "three-sandbox",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {

	const session = await auth.api.getSession({
		headers: await headers()
	});

	return (
		<html lang="en">
			<body
				className={`antialiased`}
			>
				<Providers>
					<SignInProvider>
						<SessionProvider session={session ? { user: session.user } : null}>
							{children}
						</SessionProvider>
					</SignInProvider>
				</Providers>
			</body>
		</html>
	);
}
