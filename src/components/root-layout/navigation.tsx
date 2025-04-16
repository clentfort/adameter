import { NavigationMenuLink } from '@radix-ui/react-navigation-menu';
import { fbt } from 'fbtee';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import '@/i18n';

const pages = [
	{
		icon: '🍼',
		label: () => fbt('Feeding', 'Title of the Feeding tab'),
		path: '/feeding',
	},
	{
		icon: '👶',
		label: () => fbt('Diaper', 'Title of the Diaper tab'),
		path: '/diaper',
	},
	{
		icon: '📏',
		label: () => fbt('Growth', 'Title of the Growth tab'),
		path: '/growth',
	},
	{
		icon: '📅',
		label: () => fbt('Events', 'Title of the Events tab'),
		path: '/events',
	},
	{
		icon: '📊',
		label: () => fbt('Statistics', 'Title of the Statistics tab'),
		path: '/statistics',
	},
];

export function Navigation() {
	const pathname = usePathname();
	return (
		<div className="mb-6">
			<NavigationMenu>
				<NavigationMenuList className="grid grid-cols-5">
					{pages.map((page) => {
						const isActive = pathname === page.path;
						return (
							<NavigationMenuItem key={page.path}>
								<Link href={page.path} legacyBehavior passHref>
									<NavigationMenuLink
										active={isActive}
										className={`${navigationMenuTriggerStyle()} flex flex-col xs:flex-row items-center xs:gap-1 px-1 sm:px-2 py-2 text-xs sm:text-sm`}
									>
										<span className="h-4 w-4">{page.icon}</span>
										<span className="hidden xs:inline">{page.label()}</span>
									</NavigationMenuLink>
								</Link>
							</NavigationMenuItem>
						);
					})}
				</NavigationMenuList>
			</NavigationMenu>
		</div>
	);
}
