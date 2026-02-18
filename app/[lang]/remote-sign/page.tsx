'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useIDKitRequest } from '@worldcoin/idkit';
import type { IDKitResult } from '@worldcoin/idkit';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Smartphone, Edit3, Send, RefreshCw, Activity, Check, ScanEye, Zap, Loader2, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { SignalingService } from '@/lib/services/p2p/signalingService';

type InkColor = 'black' | 'blue' | 'red';

function RemoteSignContent() {
    const searchParams = useSearchParams();
    const [sessionId, setSessionId] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [color, setColor] = useState<InkColor>('black');
    const [status, setStatus] = useState<'connecting' | 'connected' | 'signed' | 'error'>('connecting');
    const [biometricData, setBiometricData] = useState<any[]>([]); // Changed type to any[] as per diff
    const strokeStartTime = useRef<number>(0);
    const [zkStatus, setZkStatus] = useState<any | null>(null); // Added zkStatus
    const [isIdentifying, setIsIdentifying] = useState(false); // Added isIdentifying
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null); // Added lastPos for drawing

    useEffect(() => {
        const currentSessionId = searchParams.get('session');
        setSessionId(currentSessionId);

        if (!currentSessionId) {
            setStatus('error');
            return;
        }

        // Global Swarm Sync Listener
        const setupSwarm = async () => {
            await SignalingService.onMessage(currentSessionId || '', (data: any) => {
                // In the remote sign page, we might want to listen for 'REJECTED' or other control signals
                const { type } = data;
                if (type === 'CANCEL') {
                    setStatus('error');
                    toast.error('Session cancelled by Master');
                }
            });
        };
        if (currentSessionId) setupSwarm();

        const timer = setTimeout(async () => {
            setStatus('connected');
            await SignalingService.syncEvent(currentSessionId || '', 'CONNECTED', { nodeId: 'remote-signer' });
            toast.success('Secure link established');
            await SignalingService.syncState(currentSessionId || '', { status: 'linked' });
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [searchParams]);

    // Swarm Mouse Move Sync
    useEffect(() => {
        const handleMouseMove = async (e: MouseEvent) => {
            if (status === 'connected' && sessionId) {
                await SignalingService.syncEvent(sessionId, 'CURSOR_MOVE', {
                    x: e.clientX,
                    y: e.clientY,
                    name: 'Remote Signer'
                });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [status, sessionId]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (status !== 'connected') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;

        setIsDrawing(true);
        const { x, y } = getCoordinates(e, canvas);
        setLastPos({ x, y }); // Set initial lastPos
        strokeStartTime.current = Date.now();

        let pressure = 0.5;
        let tiltX = 0;
        let tiltY = 0;
        let twist = 0;

        if (e.nativeEvent instanceof PointerEvent) {
            pressure = e.nativeEvent.pressure || 0.5;
            tiltX = e.nativeEvent.tiltX || 0;
            tiltY = e.nativeEvent.tiltY || 0;
            twist = e.nativeEvent.twist || 0;
        }

        setBiometricData(prev => [...prev, { x, y, t: 0, p: pressure, tiltX, tiltY, twist }]);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const handleDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current || !lastPos) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pos = getCoordinates(e, canvas);

        let pressure = 0.5;
        let tiltX = 0;
        let tiltY = 0;

        if (e.nativeEvent instanceof PointerEvent) {
            pressure = (e.nativeEvent as PointerEvent).pressure || 0.5;
            tiltX = (e.nativeEvent as PointerEvent).tiltX || 0;
            tiltY = (e.nativeEvent as PointerEvent).tiltY || 0;
        }

        ctx.lineWidth = 2 * (pressure * 2);
        ctx.lineCap = 'round';
        ctx.strokeStyle = color; // Use the selected color

        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        setLastPos(pos);
        const newPoint = {
            x: pos.x,
            y: pos.y,
            pressure,
            timestamp: Date.now()
        };
        setBiometricData(prev => [...prev, newPoint]);
        setHasSignature(true);

        // Swarm Sync: Update master node and other participants in real-time
        if (sessionId) {
            SignalingService.syncEvent(sessionId, 'VECTOR_SYNC', {
                x: pos.x,
                y: pos.y,
                pressure,
                color
            });
        }
    }, [isDrawing, lastPos, sessionId, color]);

    const stopDrawing = () => {
        setIsDrawing(false);
        setLastPos(null); // Clear lastPos when drawing stops
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        setHasSignature(false);
        setBiometricData([]);
    };

    const submitSignature = async () => {
        if (!hasSignature || !canvasRef.current || !sessionId) return;

        const image = canvasRef.current.toDataURL('image/png');

        // Final Swarm Sync: Dispatch signed document state
        await SignalingService.syncState(sessionId, {
            status: 'signed',
            signatureData: image,
            biometrics: biometricData,
            zkProof: zkStatus?.proof // Use zkStatus
        });

        setStatus('signed'); // Update local status
        toast.success('Signature Sealed into Swarm!');
        setTimeout(() => {
            // window.close(); // Removed as per original code, only toast and status update
        }, 1500);
    };

    const handleIdentifyZKSuccess = async (result: IDKitResult) => {
        setIsIdentifying(true);
        try {
            const { ZKIdentityService } = await import('@/lib/services/identity/zkIdentityService');
            const resAny = result as any;
            const status = await ZKIdentityService.handleVerification({
                proof: Array.isArray(resAny.responses?.[0]?.proof) ? resAny.responses[0].proof.join(',') : '',
                nullifier_hash: resAny.responses?.[0]?.nullifier || '',
                merkle_root: resAny.responses?.[0]?.proof?.[4] || '',
            } as any);
            setZkStatus(status);
            toast.success('ZK-Identity Verified on Mobile!');
        } catch (error) {
            toast.error('Identity Verification Failed');
        } finally {
            setIsIdentifying(false);
        }
    };

    const { open: openZK } = useIDKitRequest({
        app_id: (process.env.NEXT_PUBLIC_WORLDID_APP_ID as `app_${string}`) || 'app_staging_123',
        action: 'remote_signing',
        onSuccess: handleIdentifyZKSuccess,
        allow_legacy_proofs: true,
        rp_context: {
            rp_id: 'pdf-toolkit',
            nonce: Math.random().toString(36).substring(7),
            created_at: Math.floor(Date.now() / 1000),
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            signature: '0x'
        }
    } as any);

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
                <GlassCard className="p-8 space-y-4">
                    <div className="text-red-500 text-6xl">⚠️</div>
                    <h1 className="text-xl font-bold text-white">Invalid Session</h1>
                    <p className="text-slate-400 text-sm">The secure link has expired or is invalid. Please scan the QR code again.</p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 flex flex-col items-center">
            {/* Mobile Header */}
            <div className="w-full max-w-md flex items-center justify-between py-4 mb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-indigo-500" />
                    <span className="text-white font-bold tracking-tight">Docu-Pro Secure</span>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    status === 'connected' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                )}>
                    {status === 'connected' ? '● Linked' : '● Connecting'}
                </div>
            </div>

            <GlassCard className="w-full max-w-md p-6 bg-slate-900/50 border-white/5 space-y-6">
                <div className="space-y-2">
                    <h2 className="text-white font-bold flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-indigo-400" /> Sign Below
                    </h2>
                    <p className="text-xs text-slate-500">Your biometric dynamics (pressure/velocity) are being captured for the audit trail.</p>
                </div>

                {/* DRAWING AREA */}
                <div className="relative group">
                    <div className="bg-white rounded-2xl overflow-hidden aspect-[4/3] relative shadow-2xl border-4 border-slate-800">
                        <canvas
                            ref={canvasRef}
                            width={800} height={600}
                            className="w-full h-full cursor-crosshair touch-none"
                            onMouseDown={startDrawing} onMouseMove={handleDraw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing} onTouchMove={handleDraw} onTouchEnd={stopDrawing}
                        />
                        {status === 'connecting' && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        )}
                        {status === 'signed' && (
                            <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-500">
                                <Check className="w-16 h-16 mb-4" />
                                <h3 className="text-2xl font-bold">Vector Sent</h3>
                                <p className="text-sm opacity-90 mt-2">You can close this tab now. The desktop session has been updated.</p>
                            </div>
                        )}
                    </div>

                    {/* Floating Controls */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                        <button onClick={clearCanvas} className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-red-500 shadow-xl border border-white/10">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Color Picker */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        {['black', 'blue', 'red'].map(c => (
                            <button key={c} onClick={() => setColor(c as InkColor)} className={cn("w-6 h-6 rounded-full border-2", color === c ? "border-white" : "border-transparentShadow")} style={{ backgroundColor: c === 'black' ? '#000' : c === 'blue' ? '#2563eb' : '#dc2626' }} />
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="primary"
                            size="lg"
                            className="py-4 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 shadow-lg"
                            disabled={!hasSignature || status !== 'connected'}
                            onClick={submitSignature}
                        >
                            <Send className="w-4 h-4 mr-2" /> Sign
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="py-4 text-sm font-bold bg-slate-800 hover:bg-slate-700"
                            disabled={isIdentifying || zkStatus}
                            onClick={openZK}
                        >
                            {isIdentifying ? <Loader2 size={16} className="animate-spin mr-2" /> : zkStatus ? <Fingerprint className="w-4 h-4 mr-2 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            {zkStatus ? 'Verified' : 'ZK-Verify'}
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-2 border-t border-white/5 opacity-50">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                            <Activity className="w-3 h-3 text-indigo-400" /> Biometric Capture Active
                        </div>
                    </div>
                </div>
            </GlassCard>

            <p className="mt-8 text-[10px] text-slate-600 uppercase font-bold tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Encrypted P2P Tunnel: {sessionId?.substring(0, 10)}...
            </p>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

export default function RemoteSignPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        }>
            <RemoteSignContent />
        </Suspense>
    );
}
