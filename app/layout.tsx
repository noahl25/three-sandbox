import type { Metadata } from "next";
import Providers from "@/providers/providers";
import "./globals.css";
import SignInPopup from "@/components/SignInPopup";
import SignInProvider from "@/components/SignInPopup";

export const metadata: Metadata = {
	title: "three-sandbox",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {

	return (
		<html lang="en">
			<body
				className={`antialiased`}
			>
				<Providers>
					<SignInProvider>
						{children}
					</SignInProvider>
				</Providers>
			</body>
		</html>
	);
}
