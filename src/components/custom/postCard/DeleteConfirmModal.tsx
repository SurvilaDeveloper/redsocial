"use client";

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
};

export function DeleteConfirmModal({ open, onClose, onConfirm, loading }: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-sm w-[90%]">
                <h4 className="text-sm font-semibold mb-2">Eliminar post</h4>
                <p className="text-xs text-slate-300 mb-4">
                    ¿Seguro que querés eliminar este post? No se borrará definitivamente de la base de datos,
                    sólo se marcará como eliminado (se podrá gestionar luego desde la papelera).
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-3 py-1 text-xs rounded border border-slate-600 hover:bg-slate-800 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-3 py-1 text-xs rounded bg-red-700 hover:bg-red-600 border border-red-500 text-white disabled:opacity-50"
                    >
                        {loading ? "Eliminando..." : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
