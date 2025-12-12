import React, { useState } from 'react';
import { UserProfile, UserRole, Permission, SensitiveDataRecord } from '../types';
import { Shield, Lock, Eye, EyeOff, Users, Key, FileText, CheckCircle, XCircle, AlertTriangle, Search, Fingerprint, Activity } from 'lucide-react';

// --- MOCK DATA ---

const MOCK_ROLES: UserRole[] = [
  {
    id: 'role-admin',
    name: 'SysAdmin',
    description: 'Full system access and configuration rights.',
    permissions: ['VIEW_PII', 'VIEW_PROPRIETARY_SEQUENCES', 'EDIT_SYSTEM_CONFIG', 'APPROVE_BUDGET', 'AUDIT_ACCESS', 'MANAGE_USERS'],
    clearanceLevel: 'L4'
  },
  {
    id: 'role-lead',
    name: 'Lead Scientist',
    description: 'Research oversight and IP access.',
    permissions: ['VIEW_PROPRIETARY_SEQUENCES', 'APPROVE_BUDGET'],
    clearanceLevel: 'L3'
  },
  {
    id: 'role-coord',
    name: 'Clinical Coordinator',
    description: 'Patient data management.',
    permissions: ['VIEW_PII'],
    clearanceLevel: 'L3'
  },
  {
    id: 'role-researcher',
    name: 'Researcher',
    description: 'Standard lab access.',
    permissions: ['VIEW_PROPRIETARY_SEQUENCES'],
    clearanceLevel: 'L2'
  },
  {
    id: 'role-auditor',
    name: 'External Auditor',
    description: 'Read-only access to logs and non-sensitive data.',
    permissions: ['AUDIT_ACCESS'],
    clearanceLevel: 'L1'
  }
];

const MOCK_USERS: UserProfile[] = [
  { id: 'u1', name: 'Dr. Marcus Webb', roleId: 'role-admin', department: 'IT & Ops', active: true, avatar: 'MW' },
  { id: 'u2', name: 'Dr. Sarah Chen', roleId: 'role-lead', department: 'Chemistry', active: true, avatar: 'SC' },
  { id: 'u3', name: 'Elena Rodriguez', roleId: 'role-coord', department: 'Clinical', active: true, avatar: 'ER' },
  { id: 'u4', name: 'James Doe', roleId: 'role-researcher', department: 'Biology', active: true, avatar: 'JD' },
  { id: 'u5', name: 'Audit Firm A', roleId: 'role-auditor', department: 'Compliance', active: true, avatar: 'AF' },
];

const SENSITIVE_DATA: SensitiveDataRecord[] = [
  { id: 'rec-001', patientId: 'PT-8829-XJ', condition: 'NSCLC (Lung)', sequenceData: 'ATCGGGT...[KRAS-G12C]...TTAAC', molecularFormula: 'C22H25N5O2 (Sotorasib deriv)', siteId: 'SITE-LDN' },
  { id: 'rec-002', patientId: 'PT-9941-AB', condition: 'Pancreatic Cancer', sequenceData: 'GGCTTA...[TP53-R175H]...CCGAT', molecularFormula: 'C19H18F3N3O (Unpublished)', siteId: 'SITE-NYC' },
  { id: 'rec-003', patientId: 'PT-1102-ZZ', condition: 'Colorectal Cancer', sequenceData: 'TTAAGC...[BRAF-V600E]...GGCCT', molecularFormula: 'C24H21ClF2N4O3 (Vemurafenib)', siteId: 'SITE-BOS' },
];

const IAMDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES' | 'VAULT'>('VAULT');
  const [simulatedUser, setSimulatedUser] = useState<UserProfile>(MOCK_USERS[0]); // Default to Admin
  
  const currentRole = MOCK_ROLES.find(r => r.id === simulatedUser.roleId)!;

  const hasPermission = (perm: Permission) => currentRole.permissions.includes(perm);

  const MaskedText: React.FC<{ text: string; visible: boolean; type: 'PII' | 'IP' }> = ({ text, visible, type }) => {
    if (visible) {
      return <span className="font-mono text-emerald-400">{text}</span>;
    }
    return (
      <div className="flex items-center gap-2 text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 w-fit select-none">
        <Lock size={12} />
        <span className="font-mono text-xs tracking-widest">{type === 'PII' ? '••••-••••' : '[REDACTED-IP]'}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      {/* Header */}
      <div className="mb-4 px-2 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
            <Fingerprint className="text-indigo-400" />
            Identity & Access Management (IAM)
          </h2>
          <p className="text-slate-400 text-sm">
            Centralized role-based access control and data masking policies.
          </p>
        </div>
        
        {/* User Simulation Control */}
        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 font-bold uppercase mr-1">Simulate As:</div>
            <select 
                value={simulatedUser.id}
                onChange={(e) => setSimulatedUser(MOCK_USERS.find(u => u.id === e.target.value)!)}
                className="bg-slate-900 border border-slate-600 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
            >
                {MOCK_USERS.map(u => (
                    <option key={u.id} value={u.id}>
                        {u.name} ({MOCK_ROLES.find(r => r.id === u.roleId)?.name})
                    </option>
                ))}
            </select>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                currentRole.clearanceLevel === 'L4' ? 'bg-red-900/30 text-red-400 border-red-800' :
                currentRole.clearanceLevel === 'L3' ? 'bg-orange-900/30 text-orange-400 border-orange-800' :
                'bg-emerald-900/30 text-emerald-400 border-emerald-800'
            }`}>
                {currentRole.clearanceLevel} Clearance
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 mx-2">
          <button onClick={() => setActiveTab('VAULT')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'VAULT' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-white'}`}>
              Data Vault (Masking Demo)
          </button>
          <button onClick={() => setActiveTab('ROLES')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'ROLES' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-white'}`}>
              Role Definitions
          </button>
          <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'USERS' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-white'}`}>
              User Directory
          </button>
      </div>

      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl mx-2 overflow-hidden flex flex-col">
          
          {/* CONTENT: DATA VAULT */}
          {activeTab === 'VAULT' && (
              <div className="flex-1 flex flex-col p-6">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Shield className="text-emerald-400" size={20}/> Sensitive Data Vault
                          </h3>
                          <p className="text-slate-400 text-sm mt-1">
                              Viewing protected records as <span className="text-white font-bold">{simulatedUser.name}</span>. 
                              Fields are masked dynamically based on your role's permissions.
                          </p>
                      </div>
                      <div className="flex gap-4">
                          <div className="flex items-center gap-2 text-xs">
                              {hasPermission('VIEW_PII') ? <CheckCircle size={14} className="text-emerald-500"/> : <XCircle size={14} className="text-red-500"/>}
                              <span className={hasPermission('VIEW_PII') ? "text-emerald-400" : "text-slate-500"}>View PII</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                              {hasPermission('VIEW_PROPRIETARY_SEQUENCES') ? <CheckCircle size={14} className="text-emerald-500"/> : <XCircle size={14} className="text-red-500"/>}
                              <span className={hasPermission('VIEW_PROPRIETARY_SEQUENCES') ? "text-emerald-400" : "text-slate-500"}>View IP</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-auto rounded-lg border border-slate-700">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-900/50 text-slate-400 font-medium">
                              <tr>
                                  <th className="p-4">Record ID</th>
                                  <th className="p-4">Patient ID <span className="text-[10px] uppercase bg-red-900/30 text-red-400 px-1 rounded ml-1">PII</span></th>
                                  <th className="p-4">Condition</th>
                                  <th className="p-4">Genomic Sequence <span className="text-[10px] uppercase bg-indigo-900/30 text-indigo-400 px-1 rounded ml-1">IP</span></th>
                                  <th className="p-4">Compound <span className="text-[10px] uppercase bg-indigo-900/30 text-indigo-400 px-1 rounded ml-1">IP</span></th>
                                  <th className="p-4">Site</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700 bg-slate-800">
                              {SENSITIVE_DATA.map(record => (
                                  <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                                      <td className="p-4 font-mono text-slate-500">{record.id}</td>
                                      <td className="p-4">
                                          <MaskedText text={record.patientId} visible={hasPermission('VIEW_PII')} type="PII" />
                                      </td>
                                      <td className="p-4 text-white">{record.condition}</td>
                                      <td className="p-4">
                                          <MaskedText text={record.sequenceData} visible={hasPermission('VIEW_PROPRIETARY_SEQUENCES')} type="IP" />
                                      </td>
                                      <td className="p-4">
                                          <MaskedText text={record.molecularFormula} visible={hasPermission('VIEW_PROPRIETARY_SEQUENCES')} type="IP" />
                                      </td>
                                      <td className="p-4 text-slate-300">{record.siteId}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* CONTENT: ROLES */}
          {activeTab === 'ROLES' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Key className="text-amber-400" size={20}/> Role Definitions
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                          Configure permissions for each role. (Read-only in simulation mode)
                      </p>
                  </div>
                  
                  <div className="flex-1 overflow-auto rounded-lg border border-slate-700">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-900/50 text-slate-400 font-medium">
                              <tr>
                                  <th className="p-4 w-48">Role Name</th>
                                  <th className="p-4 w-24 text-center">Level</th>
                                  <th className="p-4 text-center w-24">PII</th>
                                  <th className="p-4 text-center w-24">IP</th>
                                  <th className="p-4 text-center w-24">Config</th>
                                  <th className="p-4 text-center w-24">Budget</th>
                                  <th className="p-4 text-center w-24">Audit</th>
                                  <th className="p-4 text-center w-24">Users</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700 bg-slate-800">
                              {MOCK_ROLES.map(role => (
                                  <tr key={role.id} className="hover:bg-slate-700/30 transition-colors">
                                      <td className="p-4">
                                          <div className="font-bold text-white">{role.name}</div>
                                          <div className="text-xs text-slate-500">{role.description}</div>
                                      </td>
                                      <td className="p-4 text-center">
                                          <span className="font-mono text-xs bg-slate-700 px-2 py-1 rounded text-white">{role.clearanceLevel}</span>
                                      </td>
                                      <td className="p-4 text-center">{role.permissions.includes('VIEW_PII') ? <CheckCircle size={16} className="mx-auto text-emerald-500"/> : <span className="text-slate-700">-</span>}</td>
                                      <td className="p-4 text-center">{role.permissions.includes('VIEW_PROPRIETARY_SEQUENCES') ? <CheckCircle size={16} className="mx-auto text-emerald-500"/> : <span className="text-slate-700">-</span>}</td>
                                      <td className="p-4 text-center">{role.permissions.includes('EDIT_SYSTEM_CONFIG') ? <CheckCircle size={16} className="mx-auto text-emerald-500"/> : <span className="text-slate-700">-</span>}</td>
                                      <td className="p-4 text-center">{role.permissions.includes('APPROVE_BUDGET') ? <CheckCircle size={16} className="mx-auto text-emerald-500"/> : <span className="text-slate-700">-</span>}</td>
                                      <td className="p-4 text-center">{role.permissions.includes('AUDIT_ACCESS') ? <CheckCircle size={16} className="mx-auto text-emerald-500"/> : <span className="text-slate-700">-</span>}</td>
                                      <td className="p-4 text-center">{role.permissions.includes('MANAGE_USERS') ? <CheckCircle size={16} className="mx-auto text-emerald-500"/> : <span className="text-slate-700">-</span>}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* CONTENT: USERS */}
          {activeTab === 'USERS' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="mb-6 flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Users className="text-blue-400" size={20}/> User Directory
                          </h3>
                          <p className="text-slate-400 text-sm mt-1">
                              Manage user accounts and role assignments.
                          </p>
                      </div>
                      <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                          <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 w-64"/>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                      {MOCK_USERS.map(user => {
                          const role = MOCK_ROLES.find(r => r.id === user.roleId)!;
                          return (
                              <div key={user.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center gap-4 hover:border-slate-600 transition-all">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                                      role.clearanceLevel === 'L4' ? 'bg-red-600' : 
                                      role.clearanceLevel === 'L3' ? 'bg-orange-600' : 'bg-blue-600'
                                  }`}>
                                      {user.avatar}
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="font-bold text-white">{user.name}</h4>
                                      <div className="text-xs text-slate-400 mb-1">{user.department}</div>
                                      <div className="flex items-center justify-between">
                                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">{role.name}</span>
                                          <span className={`text-[10px] font-bold ${user.active ? 'text-emerald-500' : 'text-slate-500'}`}>{user.active ? 'Active' : 'Inactive'}</span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default IAMDashboard;
