export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'Faltan coordenadas' });

  try {
    // Paso 1: obtener BARMANPRE del lote espacial
    const urlLote = `https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/catastro/lote/MapServer/0/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=BARMANPRE&returnGeometry=false&f=json`;
    const loteRes = await fetch(urlLote);
    const loteData = await loteRes.json();

    if (!loteData.features || loteData.features.length === 0) {
      return res.status(404).json({ error: 'No se encontró lote en ese punto' });
    }

    const barmanpre = loteData.features[0].attributes.BARMANPRE;

    // Paso 2: obtener ficha predial por BARMANPRE
    const urlPredio = `https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/catastro/lote/MapServer/3/query?where=BARMANPRE='${barmanpre}'&outFields=PREDIRECC,PRECHIP,PRECEDCATA,PREATERRE,PREACONST,PRENBARRIO,PRECDESTIN,PRETPROP,PRECLASE&returnGeometry=false&f=json`;
    const predioRes = await fetch(urlPredio);
    const predioData = await predioRes.json();

    if (!predioData.features || predioData.features.length === 0) {
      return res.status(404).json({ error: 'Lote sin ficha predial' });
    }

    return res.status(200).json(predioData.features[0].attributes);
  } catch (e) {
    return res.status(500).json({ error: 'Error consultando IDECA' });
  }
}
