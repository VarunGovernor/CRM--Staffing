import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useCandidates } from '../../contexts/CandidatesContext';

const PIPELINE_STAGES = [
  { id: 'applied', name: 'Applied', color: 'bg-blue-500' },
  { id: 'screening', name: 'Screening', color: 'bg-yellow-500' },
  { id: 'interview', name: 'Interview', color: 'bg-purple-500' },
  { id: 'offer', name: 'Offer', color: 'bg-orange-500' },
  { id: 'hired', name: 'Hired', color: 'bg-green-500' }
];

const CandidatePipeline = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { candidates: rawCandidates, loading, updateCandidate } = useCandidates();

  const candidates = useMemo(() => rawCandidates.map(c => ({
    ...c,
    pipeline_stage: c.pipeline_stage || 'applied',
    salary: c.pay_rate ? `$${Math.round(c.pay_rate * 2080 / 1000)}k` : 'N/A',
    job_type: 'Full-time'
  })), [rawCandidates]);

  const getCandidatesByStage = (stageId) => {
    return candidates.filter(c => c.pipeline_stage === stageId);
  };

  const handleDragStart = (e, candidate) => {
    e.dataTransfer.setData('candidateId', candidate.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, stageId) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    await updateCandidate(candidateId, { pipeline_stage: stageId });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getInitialColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500',
      'bg-orange-500', 'bg-pink-500', 'bg-teal-500'
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Pipeline</h1>
                <p className="text-muted-foreground">Track candidates through the hiring process</p>
              </div>
              <Button onClick={() => window.location.href = '/candidates'} className="flex items-center gap-2">
                <Icon name="Plus" size={18} />
                Add Candidate
              </Button>
            </div>

            {/* Pipeline Board */}
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {PIPELINE_STAGES.map((stage) => {
                    const stageCandidates = getCandidatesByStage(stage.id);
                    return (
                      <div
                        key={stage.id}
                        className="w-72 flex-shrink-0"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                      >
                        {/* Stage Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${stage.color} flex-shrink-0`} />
                          <h3 className="font-semibold text-foreground">{stage.name}</h3>
                          <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium text-muted-foreground flex-shrink-0">
                            {stageCandidates.length}
                          </span>
                        </div>

                        {/* Stage Column */}
                        <div className="space-y-3 min-h-[500px] bg-muted/30 rounded-lg p-3">
                          {stageCandidates.map((candidate) => (
                            <motion.div
                              key={candidate.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, candidate)}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-card border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            >
                              {/* Card Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full ${getInitialColor(candidate.first_name)} flex items-center justify-center text-white font-medium text-sm`}>
                                    {getInitials(candidate.first_name, candidate.last_name)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground text-sm">
                                      {candidate.first_name} {candidate.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {candidate.skills?.[0] || 'Developer'}
                                    </p>
                                  </div>
                                </div>
                                <button className="p-1 hover:bg-muted rounded">
                                  <Icon name="MoreHorizontal" size={16} className="text-muted-foreground" />
                                </button>
                              </div>

                              {/* Card Footer */}
                              <div className="flex items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                                  <Icon name="DollarSign" size={12} />
                                  {candidate.salary}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                                  <Icon name="Building" size={12} />
                                  {candidate.job_type}
                                </span>
                              </div>
                            </motion.div>
                          ))}

                          {stageCandidates.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                              <Icon name="Users" size={24} className="mb-2 opacity-50" />
                              <p className="text-sm">No candidates</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CandidatePipeline;
