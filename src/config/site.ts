export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name: "Hypixel Tinder",
	description: "Find your next Hypixel friend!",
	navItems: [
		{
			label: "Home",
			href: "/",
		},
		{
			label: "Match",
			href: "/match",
		}
	],
	navMenuItems: [
		{
			label: "Profile",
			href: "/profile",
		}
	],
	links: {
		github: "https://github.com/muro-idea",
		discord: "https://discord.gg/byQWa66uGP"
	},
};
