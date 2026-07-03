import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useLang } from '../context/LanguageContext';
import getCroppedImg from '../utils/cropImage';
import { useToast } from '../context/ToastContext';
import { X } from 'lucide-react';

export default function ImageCropperModal({ imageSrc, onCropComplete, onCancel }) {
  const { t } = useLang();
  const { showToast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 400);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
      showToast(t('modal_crop_error') || 'Error cropping image', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-800">{t('modal_crop_title')}</h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative w-full h-[350px] bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-6 bg-slate-50 flex flex-col gap-6">
            <div className="flex items-center gap-4">
               <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Zoom</span>
               <input
                 type="range"
                 value={zoom}
                 min={1}
                 max={3}
                 step={0.1}
                 aria-labelledby="Zoom"
                 onChange={(e) => setZoom(e.target.value)}
                 className="flex-1 accent-indigo-600"
               />
            </div>
            
            <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={onCancel} 
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/20"
                >
                  {isProcessing ? t('loading') : t('modal_crop_save')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
