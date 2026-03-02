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

export default function Navigation({ isCondensed }: { isCondensed?: boolean }) {
	const pathname = usePathname();
	return (
		<div
			className="transition-[margin-bottom] duration-300"
			style={{
				marginBottom: isCondensed
					? 0
					: 'calc((1 - var(--header-scroll-progress, 0)) * 1.5rem)',
			}}
		>
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
										'flex w-full items-center sm:gap-1 sm:text-sm transition-all duration-300',
										isCondensed
											? 'flex-row gap-1 text-sm h-8'
											: 'flex-col text-xs sm:flex-row',
									)}
									render={<Link href={page.path} />}
									style={{
										paddingBottom: isCondensed
											? '0.25rem'
											: 'calc(0.5rem - var(--header-scroll-progress, 0) * 0.25rem)',
										paddingLeft: isCondensed
											? '0.25rem'
											: 'calc(0.5rem - var(--header-scroll-progress, 0) * 0.25rem)',
										paddingRight: isCondensed
											? '0.25rem'
											: 'calc(0.5rem - var(--header-scroll-progress, 0) * 0.25rem)',
										paddingTop: isCondensed
											? '0.25rem'
											: 'calc(0.5rem - var(--header-scroll-progress, 0) * 0.25rem)',
									}}
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
