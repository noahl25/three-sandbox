import type { Metadata } from "next";
import Providers from "@/providers/providers";
import "./globals.css";

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
					{children}
				</Providers>
			</body>
		</html>
	);
}
