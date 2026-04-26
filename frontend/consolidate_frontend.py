import os

def get_tree(startpath):
    tree_str = "Folder Structure:\n"
    for root, dirs, files in os.walk(startpath):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += f"{indent}{os.path.basename(root)}/\n"
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if f != 'frontend.txt' and f != 'consolidate_frontend.py':
                tree_str += f"{subindent}{f}\n"
    return tree_str

def consolidate_files(startpath, output_file):
    tree = get_tree(startpath)
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write(tree)
        outfile.write("\n" + "="*80 + "\n")
        outfile.write("FILE CONTENTS\n")
        outfile.write("="*80 + "\n\n")
        
        for root, dirs, files in os.walk(startpath):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if '.git' in dirs:
                dirs.remove('.git')
            if 'dist' in dirs:
                dirs.remove('dist')
                
            for file in files:
                if file in ['frontend.txt', 'consolidate_frontend.py', 'package-lock.json']:
                    continue
                
                # Skip binary files
                if file.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.svg')):
                    continue
                
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, startpath)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        outfile.write(f"--- START OF FILE: {rel_path} ---\n")
                        outfile.write(content)
                        outfile.write(f"\n--- END OF FILE: {rel_path} ---\n\n")
                except Exception as e:
                    outfile.write(f"--- COULD NOT READ FILE: {rel_path} (Error: {str(e)}) ---\n\n")

if __name__ == "__main__":
    frontend_root = "/Users/as-mac-1223/Desktop/Flight 2/flight-booking-frontend"
    output_path = "/Users/as-mac-1223/Desktop/Flight 2/flight-booking-frontend/src/frontend.txt"
    consolidate_files(frontend_root, output_path)
