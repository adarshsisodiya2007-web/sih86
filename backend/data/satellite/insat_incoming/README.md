# MOSDAC INSAT-3D/3DR Local Ingestion Drop Folder

Place official ISRO MOSDAC HDF5 satellite observation files (`*.h5` or `*.hdf5`) in this directory.

### Supported Products:
1. **L2B IMC (IMSRA Rain Product):**
   - e.g., `3RIMG_25SEP2026_0015_L2B_IMC_V01R00.h5`
   - Variables extracted: `/IMC` (Precipitation in mm/hr), `/Latitude`, `/Longitude`, `/time`
2. **L2B CTT (Cloud Top Temperature):**
   - e.g., `3RIMG_*_L2B_CTT_*.h5`
   - Variables extracted: `/CTT` (°C), `/Latitude`, `/Longitude`
3. **L1B STD (Standard Multispectral Radiance):**
   - e.g., `3RIMG_*_L1B_STD_*.h5`
   - Bands: TIR1 (10.8 µm), WV (6.7 µm), MIR (3.9 µm), VIS (0.65 µm)

### How It Works:
The VARSHANET `INSATAdapter` automatically scans this folder, picks the latest granule by timestamp/mtime, safely validates data coordinates and missing values, and integrates real observations into the live weather and nowcasting pipeline.
