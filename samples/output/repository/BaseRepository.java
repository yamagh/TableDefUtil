package repository;

import io.ebean.DB;
import io.ebean.ExpressionList;
import models.BaseModel;
import models.RlsAware;
import models.SessionInfo;
import javax.inject.Inject;

/**
 * RLSフィルタリング機能を提供する基底リポジトリ
 * @param <T> モデルの型
 */
public abstract class BaseRepository<T extends BaseModel> {

    protected final DatabaseExecutionContext executionContext;
    protected final SessionInfo sessionInfo;
    private final Class<T> beanType;

    @Inject
    public BaseRepository(DatabaseExecutionContext executionContext, SessionInfo sessionInfo, Class<T> beanType) {
        this.executionContext = executionContext;
        this.sessionInfo = sessionInfo;
        this.beanType = beanType;
    }

    /**
     * RLSフィルタを適用した検索クエリを返します。
     * @return RLSフィルタ適用後の ExpressionList
     */
    protected ExpressionList<T> rlsFilter() {
        ExpressionList<T> query = DB.find(beanType).where();

        if (sessionInfo != null && !sessionInfo.isAdmin() && RlsAware.class.isAssignableFrom(beanType)) {
            query.eq("tenantId", sessionInfo.getTenantId());
        }
        return query;
    }
}