"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Camera } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
}

const ImageUpload = ({
    value,
    onChange,
    label = "Upload Image",
    disabled = false,
}: ImageUploadProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCapturing(true);
            }
        } catch (error) {
            console.error("Failed to access camera:", error);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
            setIsCapturing(false);
        }
    };

    const captureImage = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg");
            onChange(dataUrl);
            stopCamera();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            {value ? (
                <div className="relative">
                    <Image
                        src={value}
                        alt="Uploaded image"
                        width={150}
                        height={150}
                        className="rounded-full object-cover h-[150px] w-[150px]"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => onChange("")}
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : isCapturing ? (
                <div className="relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        className="rounded-lg"
                        style={{ width: "300px" }}
                    />
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 space-x-2">
                        <Button type="button" onClick={captureImage} disabled={disabled}>
                            Capture
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={stopCamera}
                            disabled={disabled}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {label}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={startCamera}
                        disabled={disabled}
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    );
};

export default ImageUpload; 