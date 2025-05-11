import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AdminComponentProps } from '../../../types/admin';
import { Collector } from '../../../types/resume';

interface CollectorManagerProps extends AdminComponentProps {
  onDataChanged?: () => void;
}

const CollectorsManager: React.FC<CollectorManagerProps> = ({
  showNotification,
  onDataChanged
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCollector, setCurrentCollector] = useState<Collector | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'institution', // Default type
    notes: ''
  });

  useEffect(() => {
    fetchCollectors();
  }, []);

  const fetchCollectors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('collector_list')
        .select('*')
        .order('name');

      if (error) throw error;
      setCollectors(data || []);
    } catch (error) {
      console.error('Error fetching collectors:', error);
      showNotification('Error', 'Failed to load collectors data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'institution',
      notes: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddClick = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEditClick = (collector: Collector) => {
    setCurrentCollector(collector);
    setFormData({
      name: collector.name || '',
      type: collector.type || 'institution',
      notes: collector.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('collector_list')
        .insert([
          {
            name: formData.name,
            type: formData.type,
            notes: formData.notes || null
          }
        ]);

      if (error) throw error;

      showNotification('Success', 'Collector added successfully');
      setIsAddModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchCollectors();
    } catch (error) {
      console.error('Error adding collector:', error);
      showNotification('Error', 'Failed to add collector');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCollector) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('collector_list')
        .update({
          name: formData.name,
          type: formData.type,
          notes: formData.notes || null
        })
        .eq('id', currentCollector.id);

      if (error) throw error;

      showNotification('Success', 'Collector updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchCollectors();
    } catch (error) {
      console.error('Error updating collector:', error);
      showNotification('Error', 'Failed to update collector');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collector?')) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('collector_list')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('Success', 'Collector deleted successfully');
      if (onDataChanged) onDataChanged();
      await fetchCollectors();
    } catch (error) {
      console.error('Error deleting collector:', error);
      showNotification('Error', 'Failed to delete collector');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCollectorsList = () => {
    if (collectors.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No collectors found.</p>
        </div>
      );
    }

    // Group collectors by type
    const types = ['institution', 'private', 'organization', 'other'];
    const groupedCollectors: Record<string, Collector[]> = {};
    
    types.forEach(type => {
      const filtered = collectors.filter(c => c.type === type);
      if (filtered.length > 0) {
        groupedCollectors[type] = filtered;
      }
    });

    // Add any collectors with types not in our predefined list
    collectors.forEach(collector => {
      if (!types.includes(collector.type)) {
        if (!groupedCollectors['other']) {
          groupedCollectors['other'] = [];
        }
        groupedCollectors['other'].push(collector);
      }
    });

    return (
      <div className="space-y-8">
        {Object.entries(groupedCollectors).map(([type, collectorsList]) => (
          <div key={type} className="border-b border-gray-200 pb-6 mb-6 last:border-0">
            <h4 className="text-lg font-medium text-gray-800 mb-4 capitalize">{type}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collectorsList.map(collector => (
                <div key={collector.id} className="bg-gray-50 p-4 rounded-lg shadow-sm relative">
                  <h5 className="text-lg font-medium text-gray-800">
                    {collector.name.length > 22
                      ? collector.name.substring(0, 19) + '...' 
                      : collector.name
                    }
                  </h5>
                  {collector.notes && <p className="text-gray-600 mt-2">
                    {collector.notes.length > 22
                      ? collector.notes.substring(0, 19) + '...' 
                      : collector.notes
                    }
                  </p>}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(collector)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label="Edit collector"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(collector.id)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label="Delete collector"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAddModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isAddModalOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-semibold mb-4">Add New Collector</h3>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="institution">Institution</option>
                <option value="private">Private</option>
                <option value="organization">Organization</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name}
                className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Collector'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isEditModalOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-semibold mb-4">Edit Collector</h3>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="edit-type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="institution">Institution</option>
                <option value="private">Private</option>
                <option value="organization">Organization</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name}
                className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading && collectors.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-gold text-white rounded hover:bg-gold/90 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Collector
        </button>
      </div>

      {renderCollectorsList()}
      {renderAddModal()}
      {renderEditModal()}
    </div>
  );
};

export default CollectorsManager;
