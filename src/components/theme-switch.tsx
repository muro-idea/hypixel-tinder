"use client";

import { useTheme } from "next-themes";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
	Button,
} from "@nextui-org/react";
import { Sun, Moon, Palette } from "lucide-react";

const themes = [
	{ name: 'Light', value: 'light', variant: 'light', icon: <Sun color="black" /> },
	{ name: 'Dark', value: 'dark', variant: 'dark', icon: <Moon color="white" /> },
	{ name: 'System', value: 'system', variant: 'both', icon: <Palette /> },
	{ name: 'Dark Purple', value: 'dark-purple', variant: 'dark', icon: <Moon color="purple" /> },
]

export function ThemeSwitch () {
	const { theme, setTheme } = useTheme();

	const handleThemeChange = (theme: string) => {
		document.documentElement.classList.forEach(c => document.documentElement.classList.remove(c));
		setTheme(theme);
	}

	return (
		<Dropdown>
      <DropdownTrigger as="button">
				<Button
					size="sm"
					variant="flat" 
					isIconOnly
				>
					<Palette />
				</Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
				<DropdownSection>
					{themes.filter(t => t.variant === "dark").map(t => (
						<DropdownItem
							key={t.value}
							onClick={() => handleThemeChange(t.value)}
							className={`flex justify-between${t.value === theme ? ' text-primary' : ''}`}
							textValue={t.value}
						>
							<span className="flex justify-between">{t.icon} {t.name}</span>
						</DropdownItem>
					))}
				</DropdownSection>
        <DropdownSection>
					{themes.filter(t => t.variant === "light").map(t => (
						<DropdownItem
							key={t.value}
							onClick={() => handleThemeChange(t.value)}
							className={`flex justify-between${t.value === theme ? ' border border-primary' : ''}`}
							textValue={t.value}
						>
							<span className="flex justify-between">{t.icon} {t.name}</span>
						</DropdownItem>
					))}
				</DropdownSection>
				<DropdownSection>
					{themes.filter(t => t.variant === "both").map(t => (
						<DropdownItem
							key={t.value}
							onClick={() => handleThemeChange(t.value)}
							className={`flex justify-between${t.value === theme ? ' border border-primary' : ''}`}
							textValue={t.value}
						>
							<span className="flex justify-between">{t.icon} {t.name}</span>
						</DropdownItem>
					))}
				</DropdownSection>
      </DropdownMenu>
    </Dropdown>
	);
};
