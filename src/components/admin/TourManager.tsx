import React, { useState } from 'react';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

interface Tour {
  id: string;
  title: string;
  duration: string;
  image: string;
  url: string | null;
}

interface Props {
  tours: Tour[];
  onTourAdded: () => void;
  onTourUpdated: () => void;
  onTourDeleted: () => void;
  showNotification: (title: string, message: string) => void;
}

const TourManager: React.FC<Props> = ({
  tours,
  onTourAdded,
  onTourUpdated,
  onTourDeleted,
  showNotification
}) => {
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTour, setNewTour] = useState<Omit<Tour, 'id'>>({
    title: '',
    duration: '',
    image: '',
    url: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'tour') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('mark_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mark_images')
        .getPublicUrl(filePath);

      if (editingTour) {
        setEditingTour({ ...editingTour, image: publicUrl });
      } else {
        setNewTour(prev => ({ ...prev, image: publicUrl }));
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      showNotification('Error', 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTour = async (tour: Tour) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tours')
        .update(tour)
        .eq('id', tour.id);

      if (error) throw error;

      showNotification('Success', 'Tour updated successfully');
      setEditingTour(null);
      onTourUpdated();
    } catch (err) {
      console.error('Error updating tour:', err);
      showNotification('Error', 'Failed to update tour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tour?')) return;

    try {
      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('Success', 'Tour deleted successfully');
      onTourDeleted();
    } catch (err) {
      console.error('Error deleting tour:', err);
      showNotification('Error', 'Failed to delete tour');
    }
  };

  const handleAddTour = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tours')
        .insert([newTour]);

      if (error) throw error;

      showNotification('Success', 'Tour added successfully');
      setNewTour({
        title: '',
        duration: '',
        image: '',
        url: ''
      });
      setShowAddForm(false);
      onTourAdded();
    } catch (err) {
      console.error('Error adding tour:', err);
      showNotification('Error', 'Failed to add tour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ImageUploadField = ({ 
    label, 
    value,
    onChange 
  }: { 
    label: string; 
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1">
        {label}
      </label>
      <div className="space-y-2">
        {value && (
          <img
            src={value}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg"
          />
        )}
        <div className="flex items-center space-x-2">
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={onChange}
              className="hidden"
            />
            <div className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {value ? 'Change Image' : 'Upload Image'}
            </div>
          </label>
          {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {tours.map(tour => (
        <div key={tour.id} className="bg-gray-50 p-6 rounded-lg">
          {editingTour?.id === tour.id ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editingTour.title}
                onChange={e => setEditingTour({ ...editingTour, title: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                placeholder="Title"
              />
              <input
                type="text"
                value={editingTour.duration}
                onChange={e => setEditingTour({ ...editingTour, duration: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                placeholder="Duration"
              />
              <input
                type="text"
                value={editingTour.url || ''}
                onChange={e => setEditingTour({ ...editingTour, url: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                placeholder="Cal.com URL (e.g., https://cal.com/username/event)"
              />
              <ImageUploadField
                label="Tour Image"
                value={editingTour.image}
                onChange={(e) => handleImageUpload(e, 'tour')}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingTour(null)}
                  className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveTour(editingTour)}
                  className="px-4 py-2 rounded-md bg-gold text-white hover:bg-gold/90"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{tour.title}</h3>
                <p className="text-gray-600">{tour.duration}</p>
                {tour.url && (
                  <p className="text-sm text-gray-500">
                    Booking URL: {tour.url}
                  </p>
                )}
                {tour.image && (
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-48 h-32 object-cover rounded-lg"
                  />
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingTour(tour)}
                  className="p-2 text-gray-600 hover:text-gold"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteTour(tour.id)}
                  className="p-2 text-gray-600 hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Tour Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="w-full py-3 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gold hover:text-gold"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add New Tour
      </button>

      {/* Add Tour Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Tour"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newTour.title}
            onChange={e => setNewTour({ ...newTour, title: e.target.value })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
            placeholder="Title"
          />
          <input
            type="text"
            value={newTour.duration}
            onChange={e => setNewTour({ ...newTour, duration: e.target.value })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
            placeholder="Duration"
          />
          <input
            type="text"
            value={newTour.url || ''}
            onChange={e => setNewTour({ ...newTour, url: e.target.value })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
            placeholder="Cal.com URL (e.g., https://cal.com/username/event)"
          />
          <ImageUploadField
            label="Tour Image"
            value={newTour.image}
            onChange={(e) => handleImageUpload(e, 'tour')}
          />
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTour}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-gold text-white hover:bg-gold/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Tour'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TourManager;