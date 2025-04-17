const formatAgreement = function(agreement, whoIsDemanding="USER") {
    if (!agreement) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (agreement._id) {
                object.id = agreement._id.toString();
            }
            
            if (object.agreementStart || object.agreementEnd) {
                object.name = `${object.agreementStart || 'No Start'} ${object.agreementEnd || 'No End'}`;
            }
            
            // Basic date formatting with null checks
            if (object.agreementStart instanceof Date) {
                object.agreementStart = object.agreementStart.toISOString().split('T')[0];
            }
            
            if (object.agreementEnd instanceof Date) {
                object.agreementEnd = object.agreementEnd.toISOString().split('T')[0];
            }
            
            if (object.agreementSite) {
                object.agreementSite = formatSite(object.agreementSite);
            }
        }
        
        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (object.agreementServices && Array.isArray(object.agreementServices)) {
                object.agreementServices = object.agreementServices
                    .filter(service => service) // Filter out null/undefined
                    .map(s => formatService(s));
            }
            
            if (object.agreementContract) {
                object.agreementContract = formatContract(object.agreementContract);
            }
            
            if (object.agreementContractor && Array.isArray(object.agreementContractor)) {
                object.agreementContractor = object.agreementContractor
                    .filter(contractor => contractor)
                    .map(c => formatContractor(c));
            }
        }
        
        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (object.agreementBoardMembers) {
                object.agreementBoardMembers = {
                    syndic: object.agreementBoardMembers?.syndic ? 
                        formatStaff(object.agreementBoardMembers.syndic) : null,
                    adjoint: object.agreementBoardMembers?.adjoint ? 
                        formatStaff(object.agreementBoardMembers.adjoint) : null,
                    tresorier: object.agreementBoardMembers?.tresorier ? 
                        formatStaff(object.agreementBoardMembers.tresorier) : null,
                    members: object.agreementBoardMembers?.members?.filter(m => m)
                        .map(m => formatStaff(m)) || []
                };
            }
            
            if (agreement.__v !== undefined) {
                object.__v = agreement.__v;
            }
            
            if (agreement.createdAt) {
                object.createdAt = agreement.createdAt;
            }
            
            if (agreement.updatedAt) {
                object.updatedAt = agreement.updatedAt;
            }
        }
        
    } catch (error) {
        console.error(`Error formatting agreement:`, error);
        return null;
    }
    
    return object;
};

const formatContractor = function (contractor, whoIsDemanding="USER") {
    if (!contractor) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (contractor.id || contractor._id) {
                object.id = contractor.id || contractor._id.toString();
            }
            
            if (contractor.contractorTitle) {
                object.name = contractor.contractorTitle;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (contractor.contractorUser && typeof contractor.contractorUser === 'object') {
                object.contractorUser = formatUser(contractor.contractorUser, whoIsDemanding);
            }
    
            if (contractor.contractorRoles && Array.isArray(contractor.contractorRoles)) {
                object.contractorRoles = formatRole(contractor.contractorRoles, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (contractor.__v !== undefined) {
                object.__v = contractor.__v;
            }
            
            if (contractor.createdAt) {
                object.createdAt = contractor.createdAt;
            }
            
            if (contractor.updatedAt) {
                object.updatedAt = contractor.updatedAt;
            }
        }
    }
    catch (error) {
        console.error("Error formatting contractor:", error);
        return null;
    }

  return object;
};

const formatContract = function (contract, whoIsDemanding="USER") {
    if (!contract) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (contract._id) {
                object.id = contract._id.toString();
            }
            
            object.name = `Contract_${object.id}`;
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (contract.contractUser) {
                object.contractUser = formatUser(contract.contractUser, whoIsDemanding);
            }
    
            if (contract.contractContractors && Array.isArray(contract.contractContractors)) {
                object.contractContractors = contract.contractContractors.map(c => formatContractor(c, whoIsDemanding));
            } else {
                object.contractContractors = []
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (contract.__v !== undefined) {
                object.__v = contract.__v;
            }
            
            if (contract.createdAt) {
                object.createdAt = contract.createdAt;
            }
            
            if (contract.updatedAt) {
                object.updatedAt = contract.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting contract:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatNotification = function (notification, whoIsDemanding="USER") {
    if (!notification) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (notification.id || notification._id) {
                object.id = notification.id || notification._id.toString();
            }
            
            if (notification.notificationTitle) {
                object.name = notification.notificationTitle;
            }
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (notification.notificationCreator) {
                object.notificationCreator = formatUser(notification.notificationCreator, whoIsDemanding);
            }
    
            if (notification.notificationTarget && Array.isArray(notification.notificationTarget)) {
                object.notificationTarget = notification.notificationTarget.map(target => {
                    if (target.targetUser) {
                        target.targetUser = formatUser(target.targetUser, whoIsDemanding);
                    }
                    return target;
                });
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (notification.__v !== undefined) {
                object.__v = notification.__v;
            }
            
            if (notification.createdAt) {
                object.createdAt = notification.createdAt;
            }
            
            if (notification.updatedAt) {
                object.updatedAt = notification.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting notification:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatPack = function (pack, whoIsDemanding="USER") {
    if (!pack) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (pack.id || pack._id) {
                object.id = pack.id || pack._id.toString();
            }
            
            if (pack.packName) {
                object.name = pack.packName;
                object.packName = pack.packName;
            }
        }
        
        // Basic info for all users
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (pack.packDesc) {
                object.packDesc = pack.packDesc
            }
            
            if (pack.packOptions) {
                object.packOptions = pack.packOptions;
            }
            
            if (pack.packPrice) {
                object.packPrice = pack.packPrice
            }
            
            if (pack.packStatus) {
                object.packStatus = pack.packStatus;
            }
            
            if (pack.packType) {
                object.packType = pack.packType
            }
            
            if (pack.packContexts) {
                object.packContexts = pack.packContexts;
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (pack.__v !== undefined) {
                object.__v = pack.__v;
            }
            
            if (pack.createdAt) {
                object.createdAt = pack.createdAt;
            }
            
            if (pack.updatedAt) {
                object.updatedAt = pack.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting pack:`, error);
        return null; // Handle the error as needed
    }

    return object;
};

const formatPermission = function (permissions, whoIsDemanding="USER") {
    if (!Array.isArray(permissions)) {
        console.error("Input is not an array");
        return [];
    }

    return permissions.map(permission => {
        if (!permission) return null;
        const object = {}
        
        try {
            // Basic info for all users
            if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
                if (permission.id || permission._id) {
                    object.id = permission.id || permission._id.toString();
                }
                
                if (permission.permissionName) {
                    object.name = permission.permissionName;
                }
            }

            // Sensitive info for admins only
            if(['ADMIN'].includes(whoIsDemanding)) {
                if (permission.__v !== undefined) {
                    object.__v = permission.__v;
                }
                
                if (permission.createdAt) {
                    object.createdAt = permission.createdAt;
                }
                
                if (permission.updatedAt) {
                    object.updatedAt = permission.updatedAt;
                }
            }
        } catch (error) {
            console.error(`Error formatting permission:`, error);
            return null; // Handle the error as needed
        }

        return object;
    });
};

const formatRole = function (roles, whoIsDemanding="USER") {
    if (!Array.isArray(roles)) {
        console.error("Input is not an array");
        return [];
    }

    return roles.map(role => {
        if (!role) return null;
        const object = {}

        try {
            // Sensitive info for admins only
            if(['ADMIN'].includes(whoIsDemanding)) {

                if (role.__v !== undefined) {
                    object.__v = role.__v;
                }
                
                if (role.createdAt) {
                    object.createdAt = role.createdAt;
                }
                
                if (role.updatedAt) {
                    object.updatedAt = role.updatedAt;
                }
            }

            // Additional info for managers and admins
            if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
                if (role.roleType) {
                    object.roleType = role.roleType;
                }

                if (role.rolePermissions && Array.isArray(role.rolePermissions)) {
                    object.rolePermissions = formatPermission(role.rolePermissions, whoIsDemanding)
                } else {
                    object.rolePermissions = [];
                }
        
                if (role.roleInheritsFrom && Array.isArray(role.roleInheritsFrom)) {
                    object.roleInheritsFrom = role.roleInheritsFrom.map(inheritedRole =>
                        formatRole([inheritedRole], whoIsDemanding)[0]
                    );
                } else {
                    object.roleInheritsFrom = [];
                }
            }

            // Basic info for all users
            if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
                if (role.id || role._id) {
                    object.id = role.id || role._id.toString();
                }
                
                if (role.roleName) {
                    object.name = role.roleName;
                }

                if (role.roleStatus) {
                    object.roleStatus = role.roleStatus;
                }

                if (role.roleContractor) {
                    object.roleContractor = formatContractor (role.roleContractor, whoIsDemanding);
                }
        
                if (role.roleOrganization) {
                    if(role.roleOrganizationType === 'Packs'){
                        object.roleOrganization = formatPack (role.roleOrganization, whoIsDemanding);
                    
                    }else if(role.roleOrganizationType === 'Contracts'){
                        object.roleOrganization = formatContract (role.roleOrganization, whoIsDemanding);
                    }
                }

                if (role.roleOrganizationType) {   
                    object.roleOrganizationType = role.roleOrganizationType;
                }
            }
        } catch (error) {
            console.error(`Error formatting role:`, error);
            return null;
        }

        return object;
    });
};

const formatSession = function (mission, whoIsDemanding="USER") {
    if (!session) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (session.id || session._id) {
                object.id = session.id || session._id.toString();
            }
            
            object.name = session.id || session._id.toString();
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (session.userId && typeof session.userId === 'object') {
                object.userId = formatUser(session.userId, whoIsDemanding);
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (session.__v !== undefined) {
                object.__v = session.__v;
            }
            
            if (session.createdAt) {
                object.createdAt = session.createdAt;
            }
            
            if (session.updatedAt) {
                object.updatedAt = session.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting session:`, error);
        return null;
    }

    return object;
};

const formatStaff = function (staff, whoIsDemanding="USER") {
    if (!staff) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (staff.id || staff._id) {
                object.id = staff.id || staff._id.toString();
            }
            
            object.name = `${staff?.staffUser?.userFirstName} ${staff?.staffUser?.userLastName}`;
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (staff?.staffContractor) {
                object.staffContractor = formatContractor(staff.staffContractor, whoIsDemanding);
            }

            if (staff?.staffUser) {
                object.staffUser = formatUser(staff.staffUser, whoIsDemanding);
            }
    
            if (staff?.staffRoles && Array.isArray(staff.staffRoles)) {
                object.staffRoles = formatRole(staff.staffRoles, whoIsDemanding);
            } else {
                object.staffRoles = [];
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {

            if (staff.__v !== undefined) {
                object.__v = staff.__v;
            }
            
            if (staff.createdAt) {
                object.createdAt = staff.createdAt;
            }
            
            if (staff.updatedAt) {
                object.updatedAt = staff.updatedAt;
            }
        }

    } catch (error) {
        console.error(`Error formatting staff:`, error);
        return null;
    }

    return object;
};

const formatTask = function (task, whoIsDemanding="USER") {
    if (!task) return null;
    const object = {}
    
    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (task.id || task._id) {
                object.id = task.id || task._id.toString();
            }
            
            object.name = task.id || task._id.toString();
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (task.taskMission) {
                object.taskMission = formatMission (task.taskMission, whoIsDemanding);
            }
    
            if (task.taskSite) {
                object.taskSite = formatSite (task.taskSite, whoIsDemanding);
            }
    
            if (task.relatedApartment) {
                object.relatedApartment = formatApartment(task.relatedApartment, whoIsDemanding);
            }
    
            if (task.taskStuff && Array.isArray(task.taskStuff)) {
                object.taskStuff = task.taskStuff.map(staff => formatStaff(staff, whoIsDemanding));
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (task.taskNotes && Array.isArray(task.taskNotes)) {
                object.taskNotes = task.taskNotes.map(note => {
                    if (note.author) {
                        note.author = formatUser(note.author, whoIsDemanding);
                    }
                    return note;
                });
            }

            if (task.__v !== undefined) {
                object.__v = task.__v;
            }
            
            if (task.createdAt) {
                object.createdAt = task.createdAt;
            }
            
            if (task.updatedAt) {
                object.updatedAt = task.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting task:`, error);
        return null;
    }

    return object;
};

const formatTwoFA = function (twoFA, whoIsDemanding="USER") {
    if (!twoFA) return null;
    const object = {}

    try {
        // Basic info for all users
        if(['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (twoFA.id || twoFA._id) {
                object.id = twoFA.id || twoFA._id.toString();
            }
            
            object.name = twoFA.id || twoFA._id.toString();
        }

        // Additional info for managers and admins
        if(['MANAGER', 'ADMIN'].includes(whoIsDemanding)) {
            if (twoFA.twoFAUser && typeof twoFA.twoFAUser === 'object') {
                object.twoFAUser = formatUser(twoFA.twoFAUser, whoIsDemanding);
            }

            if (twoFA.twoFAStatus) {
                object.twoFAStatus = twoFA.twoFAStatus;
            }

            if (twoFA.twoFAPassCode && Array.isArray(twoFA.twoFAPassCode)) {
                object.twoFAPassCode = twoFA.twoFAPassCode.map(code => {
                    return {
                        passCodeSecret: code.passCodeSecret,
                        passCodeExpiresAt: code.passCodeExpiresAt,
                    }
                });
            }
        }

        // Sensitive info for admins only
        if(['ADMIN'].includes(whoIsDemanding)) {
            if (twoFA.__v !== undefined) {
                object.__v = twoFA.__v;
            }
            
            if (twoFA.createdAt) {
                object.createdAt = twoFA.createdAt;
            }
            
            if (twoFA.updatedAt) {
                object.updatedAt = twoFA.updatedAt;
            }
        }
    } catch (error) {
        console.error(`Error formatting twoFA:`, error);
        return null;
    }

    return object;
};

const formatUser = function (user, whoIsDemanding="USER") {
  const object = {}

  try {

    if( ['USER', 'MANAGER', 'ADMIN'].includes(whoIsDemanding)){
        object.id            = user.id || user._id.toString();
        object.name          = `${user.userFirstName} ${user.userLastName}`;
        object.userFirstName = user.userFirstName;
        object.userLastName  = user.userLastName;
        object.userStatus    = user.userStatus;
    }

    if( ['MANAGER', 'ADMIN'].includes(whoIsDemanding)){
        object.userAddress  = user.userAddress;
        object.userEmail    = user.userEmail;
        object.userPhone    = user.userPhone;
        object.userRef      = user.userRef;

        // Format userPack if not null
        if (user.userPack) {
            object.userPack = formatPack(user.userPack, whoIsDemanding)
        }

        // Format userRoles if not null
        if (user.userRoles && Array.isArray(user.userRoles)) {
            object.userRoles = formatRole(user.userRoles)
        }
    }

    if( ['ADMIN'].includes(whoIsDemanding)){
        object.__v          = user.__v;
        object.createdAt    = user.createdAt;
        object.updatedAt    = user.updatedAt;
    }

  } catch (error) {
    console.error(`Error formatting <entity>:`, error);
  }

  return object;
}

// Export all functions
module.exports = {
    formatAgreement,
    formatContractor,
    formatContract,
    formatNotification,
    formatPack,
    formatPermission,
    formatRole,
    formatSession,
    formatStaff,
    formatTask,
    formatTwoFA,
    formatUser
};