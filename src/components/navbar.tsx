'use client'

import {
	Navbar as NextUINavbar,
	NavbarContent,
	NavbarBrand,
	NavbarItem,
} from "@nextui-org/navbar";
import { Link } from "@nextui-org/link";
import { Button, User } from "@nextui-org/react"
import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import { ThemeSwitch } from "@/components/theme-switch";
import {
	GithubIcon,
	DiscordIcon,
} from "@/components/icons";

import { Logo } from "@/components/icons";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Navbar() {
	const router = useRouter()
	const { data } = useSession()
	const user = data?.user

	return (
		<NextUINavbar maxWidth="xl" position="sticky">
			<NavbarContent className="basis-1/5 sm:basis-full" justify="start">
				<NavbarBrand as="li" className="gap-3 max-w-fit">
					<NextLink className="flex justify-start items-center gap-1" href="/">
						<Logo />
						<p className="font-bold text-inherit">Hypixel Tinder</p>
					</NextLink>
				</NavbarBrand>
			</NavbarContent>

			<NavbarContent
				className="hidden sm:flex basis-1/5 sm:basis-full"
				justify="end"
			>
				<NavbarItem className="hidden sm:flex gap-2">
					<Link isExternal href={siteConfig.links.discord} aria-label="Discord">
						<DiscordIcon className="text-default-500" />
					</Link>
					<Link isExternal href={siteConfig.links.github} aria-label="Github">
						<GithubIcon className="text-default-500" />
					</Link>
					<ThemeSwitch />
				</NavbarItem>
			</NavbarContent>

			<NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
				<Link isExternal href={siteConfig.links.github} aria-label="Github">
					<GithubIcon className="text-default-500" />
				</Link>
				<Link isExternal href={siteConfig.links.discord} aria-label="Discord">
					<DiscordIcon className="text-default-500" />
				</Link>
				<ThemeSwitch />
				{user ? (
					<User   
						name={user.name}
						className="cursor-pointer"
						description={(
							<Button size="sm" variant="flat" className="h-6 z-10" color="danger" onClick={() => signOut()}>
								Logout
							</Button>
						)}
						avatarProps={{
							src: user.image,
							onClick: () => router.push(`/u/${user.id}`)
						}}
					/>
				) : (
					<Button variant="shadow" color="primary" onClick={() => signIn('discord')} aria-label="Sign In">
						Sign In
					</Button>
				)}
			</NavbarContent>
		</NextUINavbar>
	);
};
