import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

interface TimelineItem {
  id: string;
  portfolio_id: string;
  title: string;
  date: string;
  description: string;
  image: string;
  order: number;
}

interface PortfolioItem {
  id: string;
  title: string;
  year: string;
  category: string;
  description: string;
  image: string;
  timeline?: TimelineItem[];
}

interface Props {
  portfolioItems: PortfolioItem[];
  onPortfolioItemAdded: () => void;
  onPortfolioItemUpdated: () => void;
  onPortfolioItemDeleted: () => void;
  showNotification: (title: string, message: string) => void;
}

const PortfolioManager: React.FC<Props> = ({
  portfolioItems,
  onPortfolioItemAdded,
  onPortfolioItemUpdated,
  onPortfolioItemDeleted,
  showNotification
}) => {
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [newTimelineItem, setNewTimelineItem] = useState<Omit<TimelineItem, 'id' | 'portfolio_id' | 'order'>>({
    title: '',
    date: '',
    description: '',
    image: ''
  });
  const [newPortfolioItem, setNewPortfolioItem] = useState<Omit<PortfolioItem, 'id'>>({
    title: '',
    year: '',
    category: '',
    description: '',
    image: ''
  });

  const categoryOptions = ['Inventory', 'Commission'];

  useEffect(() => {
    if (selectedPortfolioId) {
      fetchTimelineItems(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);

  const fetchTimelineItems = async (portfolioId: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolio_timeline')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('order', { ascending: true });

      if (error) throw error;
      setTimelineItems(data || []);
    } catch (err) {
      console.error('Error fetching timeline items:', err);
      showNotification('Error', 'Failed to load timeline items');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'portfolio' | 'timeline') => {
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

      if (type === 'portfolio') {
        if (editingPortfolio) {
          setEditingPortfolio({ ...editingPortfolio, image: publicUrl });
        } else {
          setNewPortfolioItem(prev => ({ ...prev, image: publicUrl }));
        }
      } else {
        setNewTimelineItem(prev => ({ ...prev, image: publicUrl }));
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      showNotification('Error', 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePortfolio = async (item: PortfolioItem) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('portfolio')
        .update(item)
        .eq('id', item.id);

      if (error) throw error;

      showNotification('Success', 'Portfolio item updated successfully');
      setEditingPortfolio(null);
      onPortfolioItemUpdated();
    } catch (err) {
      console.error('Error updating portfolio item:', err);
      showNotification('Error', 'Failed to update portfolio item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this portfolio item? This will also delete all timeline entries.')) return;

    try {
      const { error } = await supabase
        .from('portfolio')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('Success', 'Portfolio item deleted successfully');
      onPortfolioItemDeleted();
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      showNotification('Error', 'Failed to delete portfolio item');
    }
  };

  const handleAddPortfolio = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('portfolio')
        .insert([newPortfolioItem]);

      if (error) throw error;

      showNotification('Success', 'Portfolio item added successfully');
      setNewPortfolioItem({
        title: '',
        year: '',
        category: '',
        description: '',
        image: ''
      });
      setShowAddForm(false);
      onPortfolioItemAdded();
    } catch (err) {
      console.error('Error adding portfolio item:', err);
      showNotification('Error', 'Failed to add portfolio item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTimelineItem = async () => {
    if (!selectedPortfolioId) return;

    setIsSubmitting(true);
    try {
      const newOrder = timelineItems.length;
      const { error } = await supabase
        .from('portfolio_timeline')
        .insert([{
          ...newTimelineItem,
          portfolio_id: selectedPortfolioId,
          order: newOrder
        }]);

      if (error) throw error;

      showNotification('Success', 'Timeline item added successfully');
      setNewTimelineItem({
        title: '',
        date: '',
        description: '',
        image: ''
      });
      fetchTimelineItems(selectedPortfolioId);
    } catch (err) {
      console.error('Error adding timeline item:', err);
      showNotification('Error', 'Failed to add timeline item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimelineItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this timeline item?')) return;

    try {
      const { error } = await supabase
        .from('portfolio_timeline')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('Success', 'Timeline item deleted successfully');
      if (selectedPortfolioId) {
        fetchTimelineItems(selectedPortfolioId);
      }
    } catch (err) {
      console.error('Error deleting timeline item:', err);
      showNotification('Error', 'Failed to delete timeline item');
    }
  };

  const ImageUploadField = ({ 
    label, 
    value,
    type,
    onChange 
  }: { 
    label: string; 
    value: string;
    type: 'portfolio' | 'timeline';
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
      {portfolioItems.map(item => (
        <div key={item.id} className="bg-gray-50 p-6 rounded-lg">
          {editingPortfolio?.id === item.id ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editingPortfolio.title}
                onChange={e => setEditingPortfolio({ ...editingPortfolio, title: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                placeholder="Title"
              />
              <input
                type="text"
                value={editingPortfolio.year}
                onChange={e => setEditingPortfolio({ ...editingPortfolio, year: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                placeholder="Year"
              />
              <select
                value={editingPortfolio.category}
                onChange={e => setEditingPortfolio({ ...editingPortfolio, category: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
              >
                {categoryOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <textarea
                value={editingPortfolio.description}
                onChange={e => setEditingPortfolio({ ...editingPortfolio, description: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                rows={4}
                placeholder="Description"
              />
              <ImageUploadField
                label="Portfolio Image"
                value={editingPortfolio.image}
                type="portfolio"
                onChange={(e) => handleImageUpload(e, 'portfolio')}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingPortfolio(null)}
                  className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSavePortfolio(editingPortfolio)}
                  className="px-4 py-2 rounded-md bg-gold text-white hover:bg-gold/90"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-gray-600">{item.year} • {item.category}</p>
                <p className="text-gray-700">{item.description}</p>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-48 h-32 object-cover rounded-lg"
                  />
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedPortfolioId(item.id);
                    setShowTimelineModal(true);
                  }}
                  className="px-4 py-2 rounded-md bg-gold/10 text-gold hover:bg-gold/20"
                >
                  Timeline
                </button>
                <button
                  onClick={() => setEditingPortfolio(item)}
                  className="p-2 text-gray-600 hover:text-gold"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeletePortfolio(item.id)}
                  className="p-2 text-gray-600 hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Portfolio Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="w-full py-3 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gold hover:text-gold"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add New Portfolio Item
      </button>

      {/* Add Portfolio Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Portfolio Item"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newPortfolioItem.title}
            onChange={e => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
            placeholder="Title"
          />
          <input
            type="text"
            value={newPortfolioItem.year}
            onChange={e => setNewPortfolioItem({ ...newPortfolioItem, year: e.target.value })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
            placeholder="Year"
          />
          <select
            value={newPortfolioItem.category}
            onChange={e => setNewPortfolioItem({ ...newPortfolioItem, category: e.target.value })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
          >
            <option value="" disabled>Select a category</option>
            {categoryOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <textarea
            value={newPortfolioItem.description}
            onChange={e => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
            rows={4}
            placeholder="Description"
          />
          <ImageUploadField
            label="Portfolio Image"
            value={newPortfolioItem.image}
            type="portfolio"
            onChange={(e) => handleImageUpload(e, 'portfolio')}
          />
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPortfolio}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-gold text-white hover:bg-gold/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Portfolio Item'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Timeline Modal */}
      <Modal
        isOpen={showTimelineModal}
        onClose={() => {
          setShowTimelineModal(false);
          setSelectedPortfolioId(null);
          setTimelineItems([]);
        }}
        title="Timeline Management"
      >
        <div className="space-y-6">
          {/* Existing Timeline Items */}
          {timelineItems.map((item, index) => (
            <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.date}</p>
                  <p className="text-sm">{item.description}</p>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>
                <div className="flex space-x-2">
                
                  <button
                    onClick={() => handleDeleteTimelineItem(item.id)}
                    className="p-2 text-gray-600 hover:text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Timeline Item Form */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Add New Timeline Item</h4>
            <div className="space-y-4">
              <input
                type="text"
                value={newTimelineItem.title}
                onChange={e => setNewTimelineItem({ ...newTimelineItem, title: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                placeholder="Title"
              />
              <input
                type="text"
                value={newTimelineItem.date}
                onChange={e => setNewTimelineItem({ ...newTimelineItem, date: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                placeholder="Date"
              />
              <textarea
                value={newTimelineItem.description}
                onChange={e => setNewTimelineItem({ ...newTimelineItem, description: e.target.value })}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
                rows={3}
                placeholder="Description"
              />
              <ImageUploadField
                label="Timeline Image"
                value={newTimelineItem.image}
                type="timeline"
                onChange={(e) => handleImageUpload(e, 'timeline')}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddTimelineItem}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md bg-gold text-white hover:bg-gold/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Timeline Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortfolioManager;