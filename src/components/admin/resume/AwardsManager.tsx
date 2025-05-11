import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AdminComponentProps } from '../../../types/admin';
import { Award } from '../../../types/resume';

interface AwardsManagerProps extends AdminComponentProps {
  onDataChanged?: () => void;
}

const AwardsManager: React.FC<AwardsManagerProps> = ({
  showNotification,
  onDataChanged
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [awards, setAwards] = useState<Award[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAward, setCurrentAward] = useState<Award | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    organization: '',
    description: ''
  });

  useEffect(() => {
    fetchAwards();
  }, []);

  const fetchAwards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      setAwards(data || []);
    } catch (error) {
      console.error('Error fetching awards:', error);
      showNotification('Error', 'Failed to load awards data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      year: '',
      organization: '',
      description: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleEditClick = (award: Award) => {
    setCurrentAward(award);
    setFormData({
      title: award.title || '',
      year: award.year?.toString() || '',
      organization: award.organization || '',
      description: award.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('awards')
        .insert([
          {
            title: formData.title,
            year: formData.year ? parseInt(formData.year) : null,
            organization: formData.organization || null,
            description: formData.description || null
          }
        ]);

      if (error) throw error;

      showNotification('Success', 'Award added successfully');
      setIsAddModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchAwards();
    } catch (error) {
      console.error('Error adding award:', error);
      showNotification('Error', 'Failed to add award');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAward) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('awards')
        .update({
          title: formData.title,
          year: formData.year ? parseInt(formData.year) : null,
          organization: formData.organization || null,
          description: formData.description || null
        })
        .eq('id', currentAward.id);

      if (error) throw error;

      showNotification('Success', 'Award updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchAwards();
    } catch (error) {
      console.error('Error updating award:', error);
      showNotification('Error', 'Failed to update award');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this award?')) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('awards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('Success', 'Award deleted successfully');
      if (onDataChanged) onDataChanged();
      await fetchAwards();
    } catch (error) {
      console.error('Error deleting award:', error);
      showNotification('Error', 'Failed to delete award');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAwardsList = () => {
    if (awards.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No awards found.</p>
        </div>
      );
    }

    // Group awards by title
    const groupedAwards = awards.reduce((acc, award) => {
      if (!acc[award.title]) {
        acc[award.title] = [];
      }
      acc[award.title].push(award);
      return acc;
    }, {} as Record<string, Award[]>);

    return (
      <div className="space-y-8">
        {Object.entries(groupedAwards).map(([title, awardsList], groupIndex) => (
          <div key={groupIndex} className="border-b border-gray-200 pb-6 mb-6 last:border-0">
            <h4 className="text-lg font-medium text-gray-800 mb-4">{title}</h4>
            <div className="space-y-4 pl-4">
              {awardsList.map(award => (
                <div key={award.id} className="border-l-2 border-gray-200 pl-4 py-1 flex justify-between">
                  <div>
                    <div className="flex items-center">
                      {award.year && <span className="text-gray-600 font-medium">{award.year}</span>}
                    </div>
                    {award.organization && <p className="text-gold font-medium mt-1">{award.organization}</p>}
                    {award.description && <p className="text-gray-700 mt-2">{award.description}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(award)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label="Edit award"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(award.id)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label="Delete award"
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
          <h3 className="text-xl font-semibold mb-4">Add New Award</h3>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
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
                disabled={isLoading || !formData.title}
                className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Award'}
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
          <h3 className="text-xl font-semibold mb-4">Edit Award</h3>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                id="edit-year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-organization" className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                id="edit-organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
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
                disabled={isLoading || !formData.title}
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

  if (isLoading && awards.length === 0) {
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
          <Plus className="w-4 h-4 mr-2" /> Add Award
        </button>
      </div>

      {renderAwardsList()}
      {renderAddModal()}
      {renderEditModal()}
    </div>
  );
};

export default AwardsManager;
