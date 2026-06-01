import os
from pypdf import PdfReader

pdf_path = r"E:\--PROYECTOS DEVELOPER---\WEB PROGRAMA DIRECTOS RIVAS TV\rivas_youtube_live_handoff\docs\marca agua.pdf"

if not os.path.exists(pdf_path):
    print("El archivo no existe en:", pdf_path)
    exit(1)

reader = PdfReader(pdf_path)
print("Número de páginas:", len(reader.pages))

page = reader.pages[0]
print("Tamaño (MediaBox):", page.mediabox)

# Mostrar imágenes o recursos en la página
print("\nRecursos de la página:")
images = page.images
print("Cantidad de imágenes encontradas en la página 0:", len(images))

for i, img in enumerate(images):
    print(f"Imagen {i}: {img.name}, formato: {img.data[:10] if img.data else 'sin datos'}")
    # Guardar imagen si es posible
    with open(f"scratch/extracted_img_{i}.png", "wb") as f:
        f.write(img.data)
    print(f"  Guardada como scratch/extracted_img_{i}.png")
