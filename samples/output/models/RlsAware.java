package models;

/**
 * RLS対象のモデルであることを示すマーカーインターフェース
 */
public interface RlsAware {
    String getTenantId();
}