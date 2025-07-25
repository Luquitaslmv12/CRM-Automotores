export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [filters, setFilters] = useState({
    marca: '',
    modelo: '',
    patente: '',
    estado: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesSnap, salesSnap, purchasesSnap] = await Promise.all([
          getDocs(collection(db, "vehiculos")),
          getDocs(collection(db, "ventas")),
          getDocs(collection(db, "compras"))
        ]);

        const vehiclesData = vehiclesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const salesData = salesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const purchasesData = purchasesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setVehicles(vehiclesData);
        setSales(salesData);
        setPurchases(purchasesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    return (
      (filters.marca === '' || vehicle.marca.toLowerCase().includes(filters.marca.toLowerCase())) &&
      (filters.modelo === '' || vehicle.modelo.toLowerCase().includes(filters.modelo.toLowerCase())) &&
      (filters.patente === '' || vehicle.patente.toLowerCase().includes(filters.patente.toLowerCase())) &&
      (filters.estado === '' || vehicle.estado === filters.estado)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-20 px-4 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
            Gestión de Vehículos
          </h1>
          <p className="text-gray-400">
            Sistema integral para compra, venta y gestión de inventario
          </p>
        </div>

        {/* Dashboard */}
        <InventoryDashboard vehicles={vehicles} />

        {/* Filtros */}
        <VehicleFilters filters={filters} setFilters={setFilters} />

        {/* Gráficos y Resumen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <SalesPerformanceChart salesData={sales} />
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-6">
              Últimas Transacciones
            </h3>
            <div className="space-y-4">
              {[...sales.slice(0, 3), ...purchases.slice(0, 3)]
                .sort((a, b) => new Date(b.fecha?.toDate?.() || b.fecha) - new Date(a.fecha?.toDate?.() || a.fecha))
                .map((transaction, index) => (
                  <TransactionItem 
                    key={`${transaction.id}-${index}`} 
                    item={transaction} 
                    index={index}
                  />
                ))
              }
            </div>
          </div>
        </div>

        {/* Listado de Vehículos */}
        <h2 className="text-xl font-semibold text-gray-300 mb-4">
          Inventario ({filteredVehicles.length} vehículos)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map(vehicle => (
            <VehicleSummaryCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </div>
  );
}