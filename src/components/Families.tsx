import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

interface Family {
    _id: string;
    name: string;
    members: string[];
    owner: string;
    resources: number;
    upgrades: {
        armory: number;
        defense: number;
        income: number;
    };
    dominancePoints: number;
}

interface PendingInvite {
    _id: string;
    inviteeId: {
        username: string;
    };
}

const Families: React.FC = () => {
    const { publicKey } = useWallet();
    const userId = publicKey ? publicKey.toString() : null;
    const [familyName, setFamilyName] = useState<string>('');
    const [newMemberUsername, setNewMemberUsername] = useState<string>('');
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState<boolean>(false);
    const [addingMember, setAddingMember] = useState<boolean>(false);
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [isPro, setIsPro] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);



    

    const fetchPlayerData = async () => {
        if (!userId) return;

        try {
            const response = await axios.get(`${BASE_API_URL}/player/profile/${userId}`);
            const data = response.data;

            setIsPro(data.isPro);
            setUsername(data.username);

            if (data.familyId) {
                const familyResponse = await axios.get(`${BASE_API_URL}/family/${data.familyId}`);
                setSelectedFamily(familyResponse.data); // Automatically set the family
            } else {
                setSelectedFamily(null); // No family
            }
        } catch (error) {
            console.error('Error fetching player data:', error);
            setError('Failed to load player data.');
        }
    };
    
    

    const fetchFamilies = async () => {
        try {
            const response = await axios.get(`${BASE_API_URL}/family`);
            setFamilies(response.data || []);
        } catch (error) {
            console.error('Error fetching families:', error);
            setError('Failed to load families.');
        }
    };

    // Fetch data on component load
    useEffect(() => {
        if (userId) {
            fetchPlayerData();
        }
    }, [userId]);

    const fetchPendingInvites = async (familyId: string) => {
        try {
            const response = await axios.get(`${BASE_API_URL}/family-invites/${familyId}/pending-invites`);
            console.log("Pending invites received in frontend:", response.data); // Log data received from backend
            setPendingInvites(response.data);
        } catch (error) {
            console.error('Error fetching pending invites:', error);
            setError('Could not load pending invites.');
        }
    };
    
    

    const createFamily = async () => {
        if (!familyName || !userId || !username) return;

        setCreating(true);
        try {
            await axios.post(`${BASE_API_URL}/family`, {
                name: familyName,
                ownerUsername: username,
                members: [username],
            });

            setFamilyName('');
            await fetchFamilies();
        } catch (error) {
            console.error('Error creating family:', error);
            setError('Could not create family. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const inviteMemberToFamily = async () => {
        if (!selectedFamily || !newMemberUsername) {
            setError('Please select a family and enter a username to invite.');
            return;
        }
        
        setAddingMember(true);
        try {
            const inviterWalletAddress = userId;
            await axios.post(`${BASE_API_URL}/family-invites/invite-member`, {
                inviterWalletAddress,
                inviteeUsername: newMemberUsername,
                familyId: selectedFamily._id,
            });

            setNewMemberUsername('');
            setSuccessMessage('Invitation sent successfully!');
            setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds
            fetchPendingInvites(selectedFamily._id);
        } catch (error) {
            console.error('Error inviting member:', error);
            setError('Could not send invite. Please try again.');
        } finally {
            setAddingMember(false);
        }
    };

    const removeMemberFromFamily = async (memberUsername: string) => {
        if (!selectedFamily?._id) return;

        try {
            const response = await axios.post(`${BASE_API_URL}/family/remove-member`, {
                familyId: selectedFamily._id,
                username: memberUsername,
            });

            if (response.status === 200) {
                await fetchFamilies();
                setError('Member removed successfully');
            } else {
                throw new Error('Failed to remove member');
            }
        } catch (error) {
            console.error('Error removing member:', error);
            setError('Could not remove member. Please try again.');
        }
    };

    

    const confirmRemoveFamily = async () => {
        if (!selectedFamily) return;

        const confirmed = window.confirm("Are you sure you want to delete this family?");
        if (!confirmed) return;

        try {
            await axios.delete(`${BASE_API_URL}/family/${selectedFamily._id}`, {
                headers: { ownerUsername: username },
            });
            await fetchFamilies();
            setSelectedFamily(null);
        } catch (error) {
            console.error('Error deleting family:', error);
            setError('Could not delete family. Please try again.');
        }
    };

// Fetch player data when `publicKey` changes
useEffect(() => {
    if (publicKey) {
        fetchPlayerData();
    }
}, [publicKey]);

// Fetch families if the user is Pro
useEffect(() => {
    if (username && isPro) {
        fetchFamilies();
    }
}, [username, isPro]);

// Fetch pending invites when a family is selected
useEffect(() => {
    if (selectedFamily) {
        fetchPendingInvites(selectedFamily._id);
    }
}, [selectedFamily]);

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-lg shadow-xl w-full">

      
          {error && (
            <div className="text-red-500 text-center bg-gray-800 p-2 rounded shadow-md">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="text-green-500 text-center bg-gray-800 p-2 rounded shadow-md">
              {successMessage}
            </div>
          )}
      

      
          {/* Family Management */}
          {isPro ? (
            <div>
              <h3 className="text-yellow-400 text-2xl font-bold mb-4 text-center">Family Management</h3>
      
              {families.length === 0 ? (
                <div className="flex flex-col mt-4 bg-gray-800 p-4 rounded-lg shadow-lg">
                  <input
                    type="text"
                    placeholder="Enter Family Name"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="p-3 border border-yellow-400 rounded bg-gray-700 text-white placeholder-gray-500 mb-4"
                  />
                  <button
                    onClick={createFamily}
                    disabled={creating}
                    className={`px-6 py-3 rounded-lg font-semibold text-gray-900 transition duration-300 ${
                      creating
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-yellow-400 hover:bg-yellow-300'
                    }`}
                  >
                    {creating ? 'Creating...' : 'Create Family'}
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {families.map((family) => (
                    <div
                      key={family._id}
                      className="bg-gray-800 border border-yellow-400 p-4 rounded-lg shadow-lg flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold text-yellow-400 text-lg">{family.name}</h3>
                        <p className="text-gray-400 text-sm">
                          Members: {family.members.join(', ') || 'No members'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFamily(family)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg"
                      >
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              )}
      
              {selectedFamily && (
                <div className="mt-6 bg-gray-800 border border-yellow-400 p-6 rounded-lg shadow-xl">
                  <h3 className="text-yellow-400 font-bold text-lg mb-4">
                    Manage Family: {selectedFamily.name}
                  </h3>
      
                  <input
                    type="text"
                    placeholder="Add Member by Username"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    className="p-3 border border-yellow-400 rounded bg-gray-700 text-white placeholder-gray-500 mb-4 w-full"
                  />
                  <button
                    onClick={inviteMemberToFamily}
                    disabled={
                      addingMember ||
                      pendingInvites.some((invite) => invite.inviteeId.username === newMemberUsername)
                    }
                    className={`w-full px-6 py-3 rounded-lg font-semibold text-gray-900 mb-4 transition duration-300 ${
                      addingMember
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-yellow-400 hover:bg-yellow-300'
                    }`}
                  >
                    {addingMember ? 'Sending Invite...' : 'Send Invite'}
                  </button>
      
                  <div className="mb-4">
                    <h4 className="text-yellow-400 font-semibold mb-2">Pending Invites</h4>
                    {pendingInvites.length > 0 ? (
                      <div className="space-y-2">
                        {pendingInvites.map((invite) => (
                          <div
                            key={invite._id}
                            className="text-gray-300 bg-gray-700 p-2 rounded-lg"
                          >
                            {invite.inviteeId?.username || 'Unknown User'} (Pending)
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">No pending invites</div>
                    )}
                  </div>
      
                  <div>
                    <h4 className="text-yellow-400 font-semibold mb-2">Family Members</h4>
                    {selectedFamily.members.length > 0 ? (
                      <div className="space-y-2">
                        {selectedFamily.members.map((member) => (
                          <div
                            key={member}
                            className="flex justify-between items-center bg-gray-700 p-2 rounded-lg"
                          >
                            <span className="text-gray-300">{member}</span>
                            <button
                              onClick={() => removeMemberFromFamily(member)}
                              className="text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">No family members yet</div>
                    )}
                  </div>
      
                  <button
                    onClick={confirmRemoveFamily}
                    className="w-full mt-4 px-6 py-3 rounded-lg font-semibold text-red-500 border border-red-500 hover:bg-red-500 hover:text-gray-900 transition duration-300"
                  >
                    Delete Family
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-500 text-center mt-4">
              Upgrade to Pro membership to create and manage families.
            </div>
          )}
        </div>
      );
      
      
      
      
};


export default Families;
