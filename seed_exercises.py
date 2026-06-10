import csv
import sys
import os
import re
import requests

# Try to extract the Supabase URL from supabase.ts
def get_supabase_url():
    default_url = "https://lsbedgdnbeuhpuyonvit.supabase.co"
    try:
        supabase_ts_path = os.path.join("src", "lib", "supabase.ts")
        if os.path.exists(supabase_ts_path):
            with open(supabase_ts_path, "r", encoding="utf-8") as f:
                content = f.read()
            match = re.search(r"const\s+supabaseUrl\s*=\s*['\"]([^'\"]+)['\"]", content)
            if match:
                return match.group(1)
    except Exception as e:
        print(f"Warning: Could not read supabaseUrl from supabase.ts ({e}). Using default.")
    return default_url

def main():
    print("=" * 60)
    print("      repes - Sincronizador de Base de Datos de Ejercicios (UPSERT)")
    print("=" * 60)
    
    supabase_url = get_supabase_url()
    print(f"URL de Supabase detectada: {supabase_url}")
    
    # Prompt for Service Role Key
    service_role_key = input("Introduce tu Supabase SERVICE_ROLE_KEY: ").strip()
    if not service_role_key:
        print("Error: El SERVICE_ROLE_KEY no puede estar vacío.")
        sys.exit(1)
        
    csv_filename = "exercisedb_con_imagenes.csv"
    if not os.path.exists(csv_filename):
        print(f"Error: No se encontró el archivo {csv_filename} en el directorio actual.")
        sys.exit(1)
        
    # Read CSV
    print(f"Leyendo {csv_filename}...")
    exercises = []
    try:
        with open(csv_filename, mode='r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader) # skip header
            
            # Map columns
            # id, name, category, primary_muscles, difficulty, image_url
            for row_num, row in enumerate(reader, 2):
                if len(row) < 6:
                    print(f"Advertencia: Fila {row_num} tiene menos de 6 columnas. Omitida.")
                    continue
                exercises.append({
                    "id": row[0].strip(),
                    "name": row[1].strip(),
                    "category": row[2].strip(),
                    "primary_muscles": row[3].strip(),
                    "difficulty": row[4].strip(),
                    "image_url": row[5].strip()
                })
    except Exception as e:
        print(f"Error al leer el archivo CSV: {e}")
        sys.exit(1)
        
    print(f"Se cargaron {len(exercises)} ejercicios en memoria.")
    
    # Supabase Headers for service_role and UPSERT (merge-duplicates)
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    # Postgrest upsert endpoint with conflict parameter
    rest_url = f"{supabase_url}/rest/v1/exercise_dictionary?on_conflict=id"
    
    # Upload in batches of 100
    print("\nSincronizando ejercicios (UPSERT) en lotes de 100...")
    batch_size = 100
    total = len(exercises)
    
    for i in range(0, total, batch_size):
        batch = exercises[i:i+batch_size]
        print(f"Sincronizando lote {i//batch_size + 1}... ({i} a {min(i+batch_size, total)} de {total})")
        try:
            r = requests.post(rest_url, headers=headers, json=batch)
            if r.status_code not in [200, 201, 204]:
                print(f"Error en lote {i//batch_size + 1} (Código {r.status_code}): {r.text}")
                print("Deteniendo la sincronización.")
                sys.exit(1)
        except Exception as e:
            print(f"Excepción al subir el lote {i//batch_size + 1}: {e}")
            sys.exit(1)
            
    print("\n" + "=" * 60)
    print(" ¡Sincronización completada! Todos los ejercicios traducidos se actualizaron con éxito.")
    print("=" * 60)

if __name__ == "__main__":
    main()
