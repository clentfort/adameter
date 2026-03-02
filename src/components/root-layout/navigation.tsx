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
import { cn } from '@/lib/utils';
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

export default function Navigation() {
	const pathname = usePathname();
	return (
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
									'flex w-full flex-row items-center justify-center gap-1 sm:text-sm h-10 px-1 transition-none!',
								)}
								render={<Link href={page.path} />}
							>
								<span className="h-4 w-4 shrink-0">{page.icon}</span>
								<span
									className="truncate hidden xs:inline-block transition-[max-width,opacity] duration-0 overflow-hidden"
									style={{
										maxWidth:
											'calc((1 - var(--header-scroll-progress, 0)) * 100px)',
										opacity: 'calc(1 - var(--header-scroll-progress, 0))',
									}}
								>
									{page.label()}
								</span>
							</NavigationMenuLink>
						</NavigationMenuItem>
					);
				})}
			</NavigationMenuList>
		</NavigationMenu>
	);
}
