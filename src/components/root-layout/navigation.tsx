import { fbt } from 'fbtee';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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

export default function Navigation({ isCondensed }: { isCondensed?: boolean }) {
	const pathname = usePathname();
	return (
		<div className={isCondensed ? 'mb-0' : 'mb-6'}>
			<NavigationMenu className="w-full max-w-none">
				<NavigationMenuList className="w-full grid grid-cols-5">
					{pages.map((page) => {
						const isActive = pathname === page.path;
						return (
							<NavigationMenuItem key={page.path}>
								<NavigationMenuLink
									active={isActive}
									className={cn(
										navigationMenuTriggerStyle(),
										'flex w-full items-center sm:gap-1 sm:px-2 sm:text-sm',
										isCondensed
											? 'flex-row gap-1 px-1 py-1 text-sm h-8'
											: 'flex-col py-2 text-xs sm:flex-row',
									)}
									render={<Link href={page.path} />}
								>
									<span className="h-4 w-4 shrink-0">{page.icon}</span>
									<span
										className={cn(
											'hidden xs:inline truncate',
											isCondensed && 'hidden sm:inline',
										)}
									>
										{page.label()}
									</span>
								</NavigationMenuLink>
							</NavigationMenuItem>
						);
					})}
				</NavigationMenuList>
			</NavigationMenu>
		</div>
	);
}
