/**
 * @fileoverview Admin QR token generation page.
 * Allows admins to generate QR tokens for office check-in.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminService } from '@/services/admin.service';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QrCode, Clock, Building, Copy, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { QRToken } from '@/types';

/**
 * QR token form schema
 */
const qrTokenSchema = z.object({
    officeId: z.string().min(1, 'Office ID is required'),
    expiresInMinutes: z.number().min(5).max(1440),
});

type QRTokenFormData = z.infer<typeof qrTokenSchema>;

/**
 * Admin QR Tokens Page Component
 * Generate QR tokens for attendance check-in
 */
export default function AdminQRTokensPage() {
    const { success, error: toastError } = useToast();
    const [generatedToken, setGeneratedToken] = useState<QRToken | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<QRTokenFormData>({
        resolver: zodResolver(qrTokenSchema),
        defaultValues: {
            expiresInMinutes: 60,
        },
    });

    /**
     * Handle generate token
     */
    const onGenerate = async (data: QRTokenFormData) => {
        setIsGenerating(true);

        try {
            const token = await adminService.generateQRToken({
                officeId: data.officeId,
                expiresInMinutes: data.expiresInMinutes,
            });

            setGeneratedToken(token);
            success('QR token generated successfully');
        } catch (error) {
            toastError(error instanceof Error ? error.message : 'Failed to generate token');
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * Copy token to clipboard
     */
    const copyToClipboard = async () => {
        if (!generatedToken) return;

        try {
            await navigator.clipboard.writeText(generatedToken.token);
            setCopied(true);
            success('Token copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toastError('Failed to copy token');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">QR Token Generator</h1>
                <p className="text-gray-500 mt-1">
                    Generate QR codes for office attendance check-in
                </p>
            </div>

            {/* Generate form */}
            <Card>
                <CardHeader
                    title="Generate New Token"
                    subtitle="Create a time-limited token for QR code check-in"
                />
                <CardContent>
                    <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
                        <Input
                            label="Office ID"
                            placeholder="Enter office ID"
                            leftIcon={<Building className="h-5 w-5" />}
                            error={errors.officeId?.message}
                            {...register('officeId')}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Expiration Time (minutes)
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min={5}
                                    max={1440}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    {...register('expiresInMinutes', { valueAsNumber: true })}
                                />
                                <Clock className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Token will be valid for this duration (5-1440 minutes)
                            </p>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isGenerating}
                            leftIcon={<QrCode className="h-5 w-5" />}
                        >
                            Generate Token
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Generated token display */}
            {generatedToken && (
                <Card variant="elevated" className="border-l-4 border-primary-500">
                    <CardHeader title="Generated Token" />
                    <CardContent className="space-y-4">
                        {/* Token value */}
                        <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm break-all">
                            {generatedToken.token}
                        </div>

                        {/* Token info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Office ID</p>
                                <p className="font-medium text-gray-900">{generatedToken.officeId}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Expires At</p>
                                <p className="font-medium text-gray-900">
                                    {format(new Date(generatedToken.expiresAt), 'MMM d, h:mm a')}
                                </p>
                            </div>
                        </div>

                        {/* Copy button */}
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={copyToClipboard}
                            leftIcon={
                                copied ? (
                                    <CheckCircle className="h-5 w-5 text-success-600" />
                                ) : (
                                    <Copy className="h-5 w-5" />
                                )
                            }
                        >
                            {copied ? 'Copied!' : 'Copy Token'}
                        </Button>

                        {/* QR Code placeholder */}
                        <div className="text-center pt-4 border-t border-gray-100">
                            <div className="inline-flex items-center justify-center w-48 h-48 bg-gray-100 rounded-lg">
                                <div className="text-center">
                                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">
                                        Use a QR library to generate<br />QR code from the token
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Instructions */}
            <Card variant="bordered">
                <CardContent className="py-4">
                    <h3 className="font-medium text-gray-900 mb-2">How to use QR tokens:</h3>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Generate a token with the office ID</li>
                        <li>Convert the token to a QR code using any QR generator</li>
                        <li>Display the QR code at the office entrance</li>
                        <li>Employees scan the QR code during check-in for verification</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
