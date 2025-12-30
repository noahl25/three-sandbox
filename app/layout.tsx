import type { Metadata } from "next";
import Providers, { SessionProvider } from "@/providers/providers";
import "./globals.css";
import PopupProvider from "@/components/Popup";
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
				<SessionProvider session={session ? { user: session.user } : null}>
						<Providers>
							<PopupProvider>
								{children}
							</PopupProvider>
						</Providers>
				</SessionProvider>
			</body>
		</html>
	);
}
