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
import { QrCode } from 'lucide-react';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import type { QRToken } from '@/types';

/**
 * QR token form schema
 * No fields required - office ID comes from authenticated admin's user record
 * Expiration time is automatically calculated to expire at 5 PM (office closing time)
 */
const qrTokenSchema = z.object({});

type QRTokenFormData = z.infer<typeof qrTokenSchema>;

/**
 * Admin QR Tokens Page Component
 * Generate QR tokens for attendance check-in
 */
export default function AdminQRTokensPage() {
    const { success, error: toastError } = useToast();
    const [generatedToken, setGeneratedToken] = useState<QRToken | null>(null);
    const [createdAt, setCreatedAt] = useState<Date | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const {
        handleSubmit,
    } = useForm<QRTokenFormData>({
        resolver: zodResolver(qrTokenSchema),
    });

    /**
     * Handle generate token
     */
    const onGenerate = async () => {
        setIsGenerating(true);

        try {
            const token = await adminService.generateQRToken({});

            setGeneratedToken(token);
            setCreatedAt(new Date());
            success('QR token generated successfully');
        } catch (error) {
            toastError(error instanceof Error ? error.message : 'Failed to generate token');
        } finally {
            setIsGenerating(false);
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
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> The QR token will be generated for your assigned office and will automatically expire at 5:00 PM today (or tomorrow if it&apos;s already past 5 PM).
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
            {generatedToken && createdAt && (
                <Card variant="elevated" className="border-l-4 border-primary-500">
                    <CardHeader title="QR Code" />
                    <CardContent className="space-y-4">
                        {/* QR Code */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
                                <QRCode
                                    value={`${window.location.origin}/check-in?qr_token=${generatedToken.token}`}
                                    size={256}
                                    level="M"
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                />
                            </div>
                        </div>

                        {/* Token info */}
                        <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-gray-500">Created At</p>
                                <p className="font-medium text-gray-900">
                                    {format(createdAt, 'MMM d, h:mm a')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Expires At</p>
                                <p className="font-medium text-gray-900">
                                    {format(new Date(generatedToken.expiresAt), 'MMM d, h:mm a')}
                                </p>
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
                        <li>Generate a token (automatically uses your assigned office)</li>
                        <li>The QR code is automatically generated from the token</li>
                        <li>Display the QR code at the office entrance</li>
                        <li>Employees scan the QR code during check-in for verification</li>
                        <li>Token automatically expires at 5:00 PM daily</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
