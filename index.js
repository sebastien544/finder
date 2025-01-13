const activePlanIds = JSON.parse(localStorage.getItem('_ms-mem')).planConnections
    .filter(item => item.status === "ACTIVE")
    .map(item => item.planId);
