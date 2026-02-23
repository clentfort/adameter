import { fbt } from 'fbtee';
import { Copy, Wifi, WifiOff } from 'lucide-react';
import { useContext, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { generateRoomName } from '@/utils/room-name';
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
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { JoinRoomDialog } from './join-room-dialog';
import { RoomQRCode } from './room-qr-code';
import { RoomQRScanner } from './room-qr-scanner';

export function DataSharingContent({ onClose }: { onClose?: () => void }) {
	const { joinRoom, room, setRoom } = useContext(DataSynchronizationContext);
	const [inputRoom, setInputRoom] = useState('');
	const [pendingJoinRoom, setPendingJoinRoom] = useState<string | null>(null);

	const handleCreateRoom = () => {
		const newRoom = generateRoomName();
		joinRoom(newRoom, 'merge');
		onClose?.();
	};

	const handleJoinRoom = () => {
		if (inputRoom) {
			setPendingJoinRoom(inputRoom);
		}
	};

	const copyInviteLink = () => {
		if (!room) return;
		const url = new URL(window.location.href);
		url.searchParams.set('room', room);
		void navigator.clipboard.writeText(url.toString());
		toast.success(fbt('Invite link copied to clipboard', 'Toast message'));
	};

	return (
		<>
			{room ? (
				<div className="flex flex-col gap-6 py-4">
					<div className="flex flex-col items-center gap-2">
						<p className="text-sm text-slate-500">
							<fbt desc="Text indicating the current room">
								Currently connected to:
							</fbt>
						</p>
						<p className="text-xl font-bold">{room}</p>
					</div>

					<div className="flex justify-center">
						<RoomQRCode room={room} />
					</div>

					<div className="flex flex-col gap-2">
						<Button onClick={copyInviteLink} variant="outline">
							<Copy className="mr-2 h-4 w-4" />
							<fbt desc="Button to copy invite link">Copy Invite Link</fbt>
						</Button>
						<Button onClick={() => setRoom(undefined)} variant="destructive">
							<fbt desc="Button to leave current room">Leave Room</fbt>
						</Button>
					</div>
				</div>
			) : (
				<Tabs defaultValue="join">
					<TabsList className="w-full">
						<TabsTrigger className="flex-1" value="join">
							<fbt desc="Label on a tab trigger to switch to the 'Join Room' tab'">
								Join room
							</fbt>
						</TabsTrigger>
						<TabsTrigger className="flex-1" value="create">
							<fbt desc="Label on a tab trigger to switch to the 'Create Room' tab'">
								Create room
							</fbt>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="join">
						<ScrollArea className="max-h-[60vh]">
							<div className="grid gap-6 py-4">
								<div className="space-y-2">
									<Label htmlFor="room">
										<fbt desc="Label for an input to set the id of a shared room">
											Room Name
										</fbt>
									</Label>
									<div className="flex gap-2">
										<Input
											id="room"
											onChange={(e) => setInputRoom(e.target.value)}
											placeholder="predicate-predicate-object"
											value={inputRoom}
										/>
										<Button onClick={handleJoinRoom} type="button">
											<fbt common={true}>Join</fbt>
										</Button>
									</div>
								</div>

								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-background px-2 text-muted-foreground">
											<fbt desc="Separator text between manual input and QR scanner">
												Or scan QR
											</fbt>
										</span>
									</div>
								</div>

								<RoomQRScanner
									onScan={(scannedRoomId) => {
										setPendingJoinRoom(scannedRoomId);
									}}
								/>
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="create">
						<div className="grid gap-4 py-8 text-center">
							<p className="text-sm text-slate-500">
								<fbt desc="Description for creating a room">
									Creating a room allows you to sync your data with other
									devices. Your current data will be merged into the new room.
								</fbt>
							</p>
							<Button onClick={handleCreateRoom} size="lg">
								<fbt desc="Button to create a new room">Create New Room</fbt>
							</Button>
						</div>
					</TabsContent>
				</Tabs>
			)}

			{pendingJoinRoom && (
				<JoinRoomDialog
					onCancel={() => setPendingJoinRoom(null)}
					onJoin={() => {
						setPendingJoinRoom(null);
						onClose?.();
					}}
					roomId={pendingJoinRoom}
				/>
			)}
		</>
	);
}

export default function DataSharingSwitcher() {
	const { room } = useContext(DataSynchronizationContext);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const Icon = room ? Wifi : WifiOff;

	return (
		<Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
			<DialogTrigger
				render={
					<Button
						aria-label={fbt('Sharing', 'Label for the sharing switcher button')}
						size="icon"
						title={fbt('Sharing', 'Label for the sharing switcher button')}
						type="button"
						variant="outline"
					/>
				}
			>
				<Icon className="h-4 w-4" />
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						<fbt desc="Title of a dialog to configure sharing options">
							Sharing
						</fbt>
					</DialogTitle>
				</DialogHeader>

				<DataSharingContent onClose={() => setIsDialogOpen(false)} />

				<DialogFooter>
					<Button onClick={() => setIsDialogOpen(false)} variant="ghost">
						<fbt common={true}>Close</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
