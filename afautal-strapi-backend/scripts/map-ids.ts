import { createStrapi } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';

async function mapGeographyIds() {
  const strapi = createStrapi({
    appDir: path.join(__dirname, '..'),
    distDir: path.join(__dirname, '..', 'dist'),
  });

  await strapi.load();

  const parseSqlInserts = (filePath: string, tableName: string) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const regex = new RegExp(`INSERT INTO \`${tableName}\` \\([^)]+\\) VALUES\\s*(.+?);`, 's');
    const match = content.match(regex);
    if (!match) return [];

    const valuesString = match[1];
    const tuples = valuesString.split(/\),\s*\(/).map(t => t.replace(/^\(/, '').replace(/\)$/, ''));

    return tuples.map(t => {
      // Very naive splitting by comma for SQL values
      const parts = t.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/).map(p => p.trim().replace(/^'|'$/g, ''));
      return parts;
    });
  };

  try {
    console.log('Parsing SQL files...');
    const ciudadesSql = parseSqlInserts('D:/pisa2025/ciudad.sql', 'ciudad');
    const comunasSql = parseSqlInserts('D:/pisa2025/comuna.sql', 'comuna');

    const ciudadesDocs = await strapi.documents('api::ciudad.ciudad').findMany({ limit: 1000 });
    const comunasDocs = await strapi.documents('api::comuna.comuna').findMany({ limit: 1000 });

    console.log(`Found ${ciudadesDocs.length} ciudades and ${comunasDocs.length} comunas in Strapi.`);

    let ciudadesUpdated = 0;
    for (const sqlData of ciudadesSql) {
      const ciud_idn = sqlData[0];
      const ciud_nombre = sqlData[1];
      
      const doc = ciudadesDocs.find(c => c.nombre.toUpperCase() === ciud_nombre.toUpperCase());
      if (doc) {
        await strapi.documents('api::ciudad.ciudad').update({
          documentId: doc.documentId,
          data: { codigo: ciud_idn } as any,
        });
        ciudadesUpdated++;
      }
    }
    console.log(`Updated ${ciudadesUpdated} ciudades with external IDs.`);

    let comunasUpdated = 0;
    for (const sqlData of comunasSql) {
      const com_idn = sqlData[0];
      const com_nombre = sqlData[1];
      
      const doc = comunasDocs.find(c => c.nombre.toUpperCase() === com_nombre.toUpperCase());
      if (doc) {
        await strapi.documents('api::comuna.comuna').update({
          documentId: doc.documentId,
          data: { codigo: com_idn } as any,
        });
        comunasUpdated++;
      }
    }
    console.log(`Updated ${comunasUpdated} comunas with external IDs.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

mapGeographyIds();
