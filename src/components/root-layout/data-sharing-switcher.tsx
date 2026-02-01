'use client';

import { fbt } from 'fbtee';
import { Copy, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { clearDoc, hasData } from '@/lib/yjs-utils';
import { generateRoomName } from '@/utils/room-names';
import { yjsContext } from '@/contexts/yjs-context';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';

export default function DataSharingSwitcher() {
	const { room, setRoom } = useContext(DataSynchronizationContext);
	const { doc } = useContext(yjsContext);
	const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
	const [inputRoomId, setInputRoomId] = useState('');
	const [generatedRoomId, setGeneratedRoomId] = useState('');
	const [isWarningOpen, setIsWarningOpen] = useState(false);
	const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const Icon = room ? Wifi : WifiOff;

	useEffect(() => {
		if (isDialogOpen && !generatedRoomId) {
			setGeneratedRoomId(generateRoomName());
		}
	}, [isDialogOpen, generatedRoomId]);

	const handleJoin = (id: string) => {
		const cleanId = id.trim();
		if (!cleanId) return;

		if (hasData(doc)) {
			setPendingRoomId(cleanId);
			setIsWarningOpen(true);
		} else {
			setRoom(cleanId);
			setIsDialogOpen(false);
		}
	};

	const confirmJoin = () => {
		if (pendingRoomId) {
			clearDoc(doc);
			setRoom(pendingRoomId);
			setPendingRoomId(null);
			setIsDialogOpen(false);
		}
		setIsWarningOpen(false);
	};

	const handleCreate = () => {
		handleJoin(generatedRoomId);
	};

	const handleLeave = () => {
		setRoom(undefined);
		setIsDialogOpen(false);
	};

	const copyJoinUrl = () => {
		if (!room) return;
		const joinUrl = `${window.location.origin}${window.location.pathname}?room=${room}`;
		navigator.clipboard.writeText(joinUrl);
		toast.success(fbt('Join URL copied to clipboard', 'Toast message after copying join URL'));
	};

	const joinUrl = room ? `${window.location.origin}${window.location.pathname}?room=${room}` : '';

	return (
		<>
			<Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
				<DialogTrigger asChild>
					<Button
						size="icon"
						title={fbt('Sharing', 'Label for the sharing switcher')}
						type="button"
						variant="outline"
					>
						<Icon className="h-4 w-4" />
						<span className="sr-only">
							<fbt desc="Label for the sharing switcher">Sharing</fbt>
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
						<DialogDescription>
							{room ? (
								<fbt desc="Description when connected to a room">
									You are currently sharing data in room <fbt:param name="room name">{room}</fbt:param>.
								</fbt>
							) : (
								<fbt desc="Description when not connected">
									Join or create a room to sync your data across devices.
								</fbt>
							)}
						</DialogDescription>
					</DialogHeader>

					{room ? (
						<div className="flex flex-col items-center gap-6 py-4">
							<div className="bg-white p-4 rounded-lg">
								<QRCodeSVG value={joinUrl} size={200} />
							</div>
							<div className="flex flex-col w-full gap-2">
								<Label className="text-center">
									<fbt desc="Label for the room ID display">Room ID</fbt>
								</Label>
								<div className="flex gap-2">
									<Input readOnly value={room} className="font-mono" />
									<Button variant="outline" size="icon" onClick={copyJoinUrl}>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
							</div>
							<Button variant="destructive" className="w-full" onClick={handleLeave}>
								<fbt desc="Button to stop sharing and leave the room">Leave Room</fbt>
							</Button>
						</div>
					) : (
						<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
							<TabsList className="w-full">
								<TabsTrigger value="join" className="flex-1">
									<fbt desc="Label on a tab trigger to switch to the 'Join Room' tab'">
										Join room
									</fbt>
								</TabsTrigger>
								<TabsTrigger value="create" className="flex-1">
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
												Room ID
											</fbt>
										</Label>
										<Input
											id="room"
											placeholder="e.g. happy-red-panda"
											value={inputRoomId}
											onChange={(e) => setInputRoomId(e.target.value)}
										/>
									</div>
									<Button className="w-full" onClick={() => handleJoin(inputRoomId)}>
										<fbt desc="Button to join a room">Join</fbt>
									</Button>
								</div>
							</TabsContent>

							<TabsContent value="create">
								<div className="grid gap-4 py-4">
									<div className="space-y-2">
										<Label>
											<fbt desc="Label for the generated room name">New Room ID</fbt>
										</Label>
										<div className="flex gap-2">
											<Input readOnly value={generatedRoomId} className="font-mono" />
											<Button
												variant="outline"
												size="icon"
												onClick={() => setGeneratedRoomId(generateRoomName())}
											>
												<RefreshCw className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<Button className="w-full" onClick={handleCreate}>
										<fbt desc="Button to create and join a room">Create & Join</fbt>
									</Button>
								</div>
							</TabsContent>
						</Tabs>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<fbt desc="Title of a warning dialog when joining a room with existing data">
								Clear local data?
							</fbt>
						</AlertDialogTitle>
						<AlertDialogDescription>
							<fbt desc="Warning message when joining a room with existing data">
								Joining a room will clear all your current local data and replace it with the data from the room. This action cannot be undone.
							</fbt>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setPendingRoomId(null)}>
							<fbt common>Cancel</fbt>
						</AlertDialogCancel>
						<AlertDialogAction onClick={confirmJoin}>
							<fbt desc="Action button to confirm clearing data and joining a room">
								Clear and Join
							</fbt>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
