import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DeliveryForm from './components/DeliveryForm.jsx';
import DeliveryTable from './components/DeliveryTable.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
import HistoryManager from './components/HistoryManager.jsx';
import OcrTool from './components/OcrTool.jsx';
import DriverManagementModal from './components/DriverManagementModal.jsx';
import { ToastContainer } from './components/Toast.jsx';
import { UsersIcon } from './components/icons.jsx';

const html2canvas = (window as any).html2canvas;

const Logo = () => (
    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary-500 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l8 4 8-4" />
        </svg>
    </div>
);


const App = () => {
    const [currentRecords, setCurrentRecords] = useState([]);
    const [worksheets, setWorksheets] = useState([]);
    const [titularDrivers, setTitularDrivers] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);
    const [activeWorksheetId, setActiveWorksheetId] = useState('current');
    const [toasts, setToasts] = useState([]);
    const [isDriverModalOpen, setDriverModalOpen] = useState(false);

    // Load from localStorage on mount and perform data migration if needed
    useEffect(() => {
        try {
            const savedRecordsRaw = localStorage.getItem('currentRecords');
            if (savedRecordsRaw) {
                let savedRecords = JSON.parse(savedRecordsRaw);
                // Simple migration from old data structure
                if (savedRecords.length > 0 && savedRecords[0].zone !== undefined) {
                    addToast('Actualizando formato de datos...', 'info');
                    savedRecords = savedRecords.map((r) => ({
                        ...r,
                        locality: r.zone,
                        parties: r.locations,
                        isFullLocality: false,
                        zone: undefined,
                        locations: undefined,
                    }));
                    localStorage.setItem('currentRecords', JSON.stringify(savedRecords));
                }
                setCurrentRecords(savedRecords);
            }
            
            const savedWorksheetsRaw = localStorage.getItem('worksheets');
            if (savedWorksheetsRaw) {
                let savedWorksheets = JSON.parse(savedWorksheetsRaw);
                 if (savedWorksheets.length > 0 && savedWorksheets[0].records.length > 0 && savedWorksheets[0].records[0]?.zone !== undefined) {
                    savedWorksheets = savedWorksheets.map((ws) => ({
                        ...ws,
                        records: ws.records.map((r) => ({
                            ...r,
                            locality: r.zone,
                            parties: r.locations,
                            isFullLocality: false,
                            zone: undefined,
                            locations: undefined,
                        }))
                    }));
                    localStorage.setItem('worksheets', JSON.stringify(savedWorksheets));
                }
                setWorksheets(savedWorksheets);
            }

            const savedDriversRaw = localStorage.getItem('titularDrivers');
            if (savedDriversRaw) {
                let savedDrivers = JSON.parse(savedDriversRaw);
                if (savedDrivers.length > 0 && savedDrivers[0].zone !== undefined) {
                    savedDrivers = savedDrivers.map((d) => ({
                        ...d,
                        locality: d.zone,
                        zone: undefined,
                    }));
                    localStorage.setItem('titularDrivers', JSON.stringify(savedDrivers));
                }
                setTitularDrivers(savedDrivers);
            }

        } catch (error) {
            console.error("Failed to load or migrate from localStorage", error);
            addToast("No se pudieron cargar los datos guardados.", "error");
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem('currentRecords', JSON.stringify(currentRecords));
        } catch (error) {
            console.error("Failed to save current records to localStorage", error);
            addToast("Error al guardar la planilla actual.", "error");
        }
    }, [currentRecords]);

     useEffect(() => {
        try {
            localStorage.setItem('worksheets', JSON.stringify(worksheets));
        } catch (error) {
            console.error("Failed to save worksheets to localStorage", error);
            addToast("Error al guardar el historial de planillas.", "error");
        }
    }, [worksheets]);

     useEffect(() => {
        try {
            localStorage.setItem('titularDrivers', JSON.stringify(titularDrivers));
        } catch (error) {
            console.error("Failed to save titular drivers to localStorage", error);
            addToast("Error al guardar los conductores.", "error");
        }
    }, [titularDrivers]);
    
    const driverLocalityMap = useMemo(() => {
        return titularDrivers.reduce((acc, driver) => {
            acc[driver.name] = driver.locality;
            return acc;
        }, {});
    }, [titularDrivers]);

    const addToast = useCallback((message, type) => {
        const newToast = { id: Date.now(), message, type };
        setToasts(prev => [...prev, newToast]);
    }, []);

    const removeToast = (id) => {
        setToasts(toasts => toasts.filter(toast => toast.id !== id));
    };

    const handleSaveRecord = (recordData, id) => {
        if (id) { // Update
            setCurrentRecords(prev => prev.map(r => r.id === id ? { ...r, ...recordData, id } : r));
            addToast('Registro actualizado con éxito.', 'success');
        } else { // Create
            const newRecord = { ...recordData, id: Date.now().toString() };
            setCurrentRecords(prev => [...prev, newRecord]);
            addToast('Registro guardado con éxito.', 'success');
        }
        setEditingRecord(null);
    };

    const handleEditRecord = (record) => {
        setEditingRecord(record);
        const formElement = document.getElementById('delivery-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDeleteRecord = (id) => {
        setCurrentRecords(prev => prev.filter(r => r.id !== id));
        addToast('Registro eliminado.', 'info');
    };

    const clearForm = () => {
        setEditingRecord(null);
    };

    const handleArchiveWorksheet = () => {
        if (currentRecords.length === 0) {
            addToast('No hay registros en la planilla actual para archivar.', 'error');
            return;
        }
        const newWorksheet = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            records: [...currentRecords]
        };
        setWorksheets(prev => [newWorksheet, ...prev]);
        setCurrentRecords([]);
        addToast('Planilla archivada con éxito.', 'success');
    };



    const handleSelectWorksheet = (id) => {
        setActiveWorksheetId(id);
        setEditingRecord(null); 
    };
    
    const displayRecords = useMemo(() => {
        if (activeWorksheetId === 'current') {
            return currentRecords;
        }
        const found = worksheets.find(ws => ws.id === activeWorksheetId);
        return found ? found.records : [];
    }, [activeWorksheetId, currentRecords, worksheets]);


    const isReadOnly = activeWorksheetId !== 'current';

    const handleDownloadJpg = () => {
        const printableArea = document.getElementById('printable-area');
        if (printableArea && typeof html2canvas !== 'undefined') {
            addToast('Generando imagen...', 'info');

            html2canvas(printableArea, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: document.body.classList.contains('dark') ? '#020617' : '#f8fafc'
            }).then((canvas) => {
                const link = document.createElement('a');
                const date = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
                link.download = `planilla-${date}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();
                addToast('Descarga iniciada.', 'success');
            }).catch((err) => {
                console.error("Error generating JPG:", err);
                addToast('Error al generar la imagen.', 'error');
            });
        } else {
            addToast('No se pudo encontrar el área para descargar.', 'error');
        }
    };
    
    const handleSaveTitularDriver = (driverData, id) => {
        if(id) {
            setTitularDrivers(prev => prev.map(d => d.id === id ? { ...d, ...driverData, id } : d));
            addToast('Conductor actualizado.', 'success');
        } else {
            const newDriver = { ...driverData, id: Date.now().toString() };
            setTitularDrivers(prev => [...prev, newDriver]);
            addToast('Conductor titular guardado.', 'success');
        }
    };
    
    const handleDeleteTitularDriver = (id) => {
        if(window.confirm('¿Seguro que quieres eliminar este conductor titular?')) {
            setTitularDrivers(prev => prev.filter(d => d.id !== id));
            addToast('Conductor eliminado.', 'info');
        }
    };

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <DriverManagementModal 
                isOpen={isDriverModalOpen}
                onClose={() => setDriverModalOpen(false)}
                drivers={titularDrivers}
                onSave={handleSaveTitularDriver}
                onDelete={handleDeleteTitularDriver}
            />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex justify-between items-center mb-10">
                     <div className="flex items-center gap-4">
                        <Logo />
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                                Gestor de Entregas
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">Tu centro de operaciones para la logística.</p>
                        </div>
                    </div>
                     <button 
                        onClick={() => setDriverModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/50 rounded-lg shadow-sm hover:bg-primary-200 dark:hover:bg-primary-900 transition-colors"
                        title="Gestionar Conductores Titulares"
                     >
                        <UsersIcon className="w-5 h-5"/>
                        <span className="hidden md:inline">Conductores</span>
                    </button>
                </header>

                <main className="space-y-8">
                    <HistoryManager
                        worksheets={worksheets}
                        activeWorksheetId={activeWorksheetId}
                        onSelectWorksheet={handleSelectWorksheet}
                        onArchive={handleArchiveWorksheet}
                        isReadOnly={isReadOnly}
                        onDownloadJpg={handleDownloadJpg}
                    />
                    
                    <div id="printable-area" className="bg-transparent p-1 rounded-lg">
                        {isReadOnly ? (
                             <div className="text-center p-4 mb-6 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 rounded-xl">
                                Estás viendo una planilla archivada en modo de solo lectura.
                            </div>
                        ) : (
                          <div id="delivery-form">
                            <DeliveryForm
                                onSave={handleSaveRecord}
                                editingRecord={editingRecord}
                                clearForm={clearForm}
                                driverLocalityMap={driverLocalityMap}
                                disabled={isReadOnly}
                            />
                          </div>
                        )}
                        <div className="mt-8">
                            <SummaryPanel records={displayRecords} />
                            <div className="mt-8">
                                <DeliveryTable
                                    records={displayRecords}
                                    onEdit={handleEditRecord}
                                    onDelete={handleDeleteRecord}
                                    isReadOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    <OcrTool />
                </main>
                 <footer className="text-center mt-16 py-6 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">&copy; {new Date().getFullYear()} Gestor de Entregas. Diseñado con ❤️.</p>
                </footer>
            </div>
        </>
    );
};

export default App;