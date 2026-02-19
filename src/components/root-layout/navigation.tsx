import { fbt } from 'fbtee';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
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
		icon: '💊',
		label: () => fbt('Medication', 'Title of the Medication tab'),
		path: '/medication',
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

export default function Navigation() {
	const pathname = usePathname();
	return (
		<div className="mb-6">
			<NavigationMenu className="w-full max-w-none">
				<NavigationMenuList className="w-full grid grid-cols-6">
					{pages.map((page) => {
						const isActive = pathname === page.path;
						return (
							<NavigationMenuItem key={page.path}>
								<NavigationMenuLink
									active={isActive}
									className={`${navigationMenuTriggerStyle()} flex w-full flex-col items-center py-2 text-xs sm:flex-row sm:gap-1 sm:px-2 sm:text-sm`}
									render={<Link href={page.path} />}
								>
									<span className="h-4 w-4">{page.icon}</span>
									<span className="hidden xs:inline">{page.label()}</span>
								</NavigationMenuLink>
							</NavigationMenuItem>
						);
					})}
				</NavigationMenuList>
			</NavigationMenu>
		</div>
	);
}
