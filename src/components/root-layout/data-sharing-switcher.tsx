import { fbt } from 'fbtee';
import { Wifi, WifiOff } from 'lucide-react';
import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export default function DataSharingSwitcher() {
	const { room, setRoom } = useContext(DataSynchronizationContext);

	const Icon = room ? Wifi : WifiOff;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="icon"
					title={fbt('Sharing', 'Label for the sharing switcher button')}
					type="button"
					variant="outline"
				>
					<Icon className="h-4 w-4" />
					<span className="sr-only">
						<fbt desc="Label for the sharing switcher button">Sharing</fbt>
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<fbt desc="Title of a dialog to configure sharing options">
							Sharing
						</fbt>
					</DialogTitle>
				</DialogHeader>

				<Tabs>
					<TabsList className="w-full">
						<TabsTrigger value="join">
							<fbt desc="Label on a tab trigger to switch to the 'Join Room' tab'">
								Join room
							</fbt>
						</TabsTrigger>
						<TabsTrigger value="create">
							<fbt desc="Label on a tab trigger to switch to the 'Create Room' tab'">
								Create room
							</fbt>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="join">
						<div className="grid gap-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="room">
									<fbt desc="Label for an input to set the id of a shared room">
										Room
									</fbt>
								</Label>
								<Input id="room" />
							</div>
						</div>
					</TabsContent>

					<TabsContent value="create">
						<div className="grid gap-4 py-4" />
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button onClick={() => setRoom('feeding')} type="submit">
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
