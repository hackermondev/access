import React from 'react';

import {Link as RouterLink, useParams, useSearchParams} from 'react-router-dom';
import Link from '@mui/material/Link';

import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import {lightGreen, red} from '@mui/material/colors';

import dayjs from 'dayjs';

import {displayGroupType} from '../../helpers';
import {displayUserName} from '../../helpers';
import {useGetRoleById, useGetGroupRoleAudits, useGetGroups} from '../../api/apiComponents';
import {RoleGroup} from '../../api/apiSchemas';
import NotFound from '../NotFound';
import CreatedReason from '../../components/CreatedReason';
import Loading from '../../components/Loading';
import Started from '../../components/Started';
import Ending from '../../components/Ending';
import TablePaginationActions from '../../components/actions/TablePaginationActions';

type OrderBy = 'moniker' | 'created_at' | 'ended_at';
type OrderDirection = 'asc' | 'desc';

export default function AuditRole() {
  const {id} = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  const [orderBy, setOrderBy] = React.useState<OrderBy>('created_at');
  const [orderDirection, setOrderDirection] = React.useState<OrderDirection>('desc');
  const [searchQuery, setSearchQuery] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState('');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);

  const [filterActive, setFilterActive] = React.useState<boolean | null>();
  const [filterOwner, setFilterOwner] = React.useState<boolean | null>();

  React.useEffect(() => {
    setOrderBy((searchParams.get('order_by') as OrderBy) ?? 'created_at');
    setOrderDirection((searchParams.get('order_desc') ?? 'true') === 'true' ? 'desc' : 'asc');
    setSearchQuery(searchParams.get('q') ?? null);
    if (searchInput == '') {
      setSearchInput(searchParams.get('q') ?? '');
    }
    setFilterActive(searchParams.get('active') == null ? null : searchParams.get('active') == 'true');
    setFilterOwner(searchParams.get('owner') == null ? null : searchParams.get('owner') == 'true');
    setPage(parseInt(searchParams.get('page') ?? '0', 10));
    setRowsPerPage(parseInt(searchParams.get('per_page') ?? '20', 10));
  }, [searchParams]);

  const {
    data: roleData,
    isError,
    isLoading: userIsLoading,
  } = useGetRoleById({
    pathParams: {roleId: id ?? ''},
  });

  const {
    data,
    error,
    isLoading: userAuditIsLoading,
  } = useGetGroupRoleAudits({
    queryParams: Object.assign(
      {role_id: id ?? '', page: page, per_page: rowsPerPage},
      orderBy == null ? null : {order_by: orderBy},
      orderDirection == null ? null : {order_desc: orderDirection == 'desc' ? 'true' : 'false'},
      searchQuery == null ? null : {q: searchQuery},
      filterActive == null ? null : {active: filterActive},
      filterOwner == null ? null : {owner: filterOwner},
    ),
  });

  const {data: searchData} = useGetGroups({
    queryParams: {page: 0, per_page: 10, q: searchInput},
  });

  if (isError) {
    return <NotFound />;
  }

  if (userIsLoading || userAuditIsLoading) {
    return <Loading />;
  }

  const role = roleData ?? ({} as RoleGroup);

  const rows = data?.results ?? [];
  const totalRows = data?.total ?? 0;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = rowsPerPage - rows.length;

  const searchRows = searchData?.results ?? [];

  const handleSortChange = (property: OrderBy) => (event: React.MouseEvent<unknown>) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setSearchParams((params) => {
      params.set('order_by', property);
      params.set('order_desc', isAsc ? 'true' : 'false');
      return params;
    });
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setSearchParams((params) => {
      params.set('page', newPage.toString(10));
      return params;
    });
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchParams((params) => {
      params.set('page', '0');
      params.set('per_page', event.target.value);
      return params;
    });
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchSubmit = (event: React.SyntheticEvent, newValue: string | null) => {
    if (newValue == null) {
      setSearchParams((params) => {
        params.delete('q');
        return params;
      });
    } else {
      setSearchParams((params) => {
        params.set('page', '0');
        params.set('q', newValue);
        return params;
      });
      setPage(0);
    }
    setSearchQuery(newValue);
  };

  const handleActiveOrInactive = (event: React.MouseEvent<HTMLElement>, newValue: boolean | null) => {
    if (newValue == null) {
      setSearchParams((params) => {
        params.delete('active');
        return params;
      });
    } else {
      setSearchParams((params) => {
        params.set('active', newValue ? 'true' : 'false');
        return params;
      });
    }
    setFilterOwner(newValue);
  };

  const handleOwnerOrMember = (event: React.MouseEvent<HTMLElement>, newValue: boolean | null) => {
    console.log(newValue);
    if (newValue == null) {
      setSearchParams((params) => {
        params.delete('owner');
        return params;
      });
    } else {
      setSearchParams((params) => {
        params.set('owner', newValue ? 'true' : 'false');
        return params;
      });
    }
    setFilterOwner(newValue);
  };

  return (
    <React.Fragment>
      <TableContainer component={Paper}>
        <Table sx={{minWidth: 650}} size="small" aria-label="groups">
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography component="h5" variant="h5" color="primary">
                  {(role.deleted_at ?? null) != null ? (
                    <Link
                      to={`/roles/${role.id}`}
                      sx={{textDecoration: 'line-through', color: 'inherit'}}
                      component={RouterLink}>
                      {role.name}
                    </Link>
                  ) : (
                    <Link
                      to={`/roles/${role.name}`}
                      sx={{textDecoration: 'none', color: 'inherit'}}
                      component={RouterLink}>
                      {role.name}
                    </Link>
                  )}{' '}
                  Role Audit
                </Typography>
              </TableCell>
              <TableCell>
                <ToggleButtonGroup exclusive value={filterActive} onChange={handleActiveOrInactive}>
                  <ToggleButton value={true}>Active</ToggleButton>
                  <ToggleButton value={false}>Inactive</ToggleButton>
                </ToggleButtonGroup>
              </TableCell>
              <TableCell colSpan={2}>
                <ToggleButtonGroup exclusive value={filterOwner} onChange={handleOwnerOrMember}>
                  <ToggleButton value={false}>Member</ToggleButton>
                  <ToggleButton value={true}>Owner</ToggleButton>
                </ToggleButtonGroup>
              </TableCell>
              <TableCell align="right" colSpan={4}>
                <Autocomplete
                  freeSolo
                  filterOptions={(x) => x}
                  options={searchRows.map((row) => row.name)}
                  onChange={handleSearchSubmit}
                  onInputChange={(event, newInputValue) => setSearchInput(newInputValue)}
                  defaultValue={searchQuery}
                  key={searchQuery}
                  renderInput={(params) => <TextField {...params} label={'Search' as any} />}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'moniker'}
                  direction={orderBy === 'moniker' ? orderDirection : 'desc'}
                  onClick={handleSortChange('moniker')}>
                  Group Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Group Type</TableCell>
              <TableCell>Member or Owner</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'created_at'}
                  direction={orderBy === 'created_at' ? orderDirection : 'desc'}
                  onClick={handleSortChange('created_at')}>
                  Started
                </TableSortLabel>
              </TableCell>
              <TableCell>Added by</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'ended_at'}
                  direction={orderBy === 'ended_at' ? orderDirection : 'desc'}
                  onClick={handleSortChange('ended_at')}>
                  Ending
                </TableSortLabel>
              </TableCell>
              <TableCell>Removed by</TableCell>
              <TableCell align="center">Justification</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  bgcolor: row.ended_at == null || dayjs().isBefore(dayjs(row.ended_at)) ? lightGreen[100] : red[100],
                }}>
                <TableCell>
                  {(row.group?.deleted_at ?? null) != null ? (
                    <Link
                      to={`/groups/${row.group?.id ?? ''}`}
                      sx={{textDecoration: 'line-through', color: 'inherit'}}
                      component={RouterLink}>
                      {row.group?.name ?? ''}
                    </Link>
                  ) : (
                    <Link
                      to={`/groups/${row.group?.name ?? ''}`}
                      sx={{textDecoration: 'none', color: 'inherit'}}
                      component={RouterLink}>
                      {row.group?.name ?? ''}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  {(row.group?.deleted_at ?? null) != null ? (
                    displayGroupType(row.group)
                  ) : (
                    <Link
                      to={`/groups/${row.group?.name ?? ''}`}
                      sx={{textDecoration: 'none', color: 'inherit'}}
                      component={RouterLink}>
                      {displayGroupType(row.group)}
                    </Link>
                  )}
                </TableCell>
                <TableCell>{row.is_owner ? 'Owner' : 'Member'}</TableCell>
                <TableCell>
                  <Started memberships={[row]} />
                </TableCell>
                <TableCell>
                  {(row.created_actor?.deleted_at ?? null) != null ? (
                    <Link
                      to={`/users/${row.created_actor?.id ?? ''}`}
                      sx={{textDecoration: 'line-through', color: 'inherit'}}
                      component={RouterLink}>
                      {displayUserName(row.created_actor)}
                    </Link>
                  ) : (
                    <Link
                      to={`/users/${(row.created_actor?.email ?? '').toLowerCase()}`}
                      sx={{textDecoration: 'none', color: 'inherit'}}
                      component={RouterLink}>
                      {displayUserName(row.created_actor)}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <Ending memberships={[row]} />
                </TableCell>
                <TableCell>
                  {row.ended_at != null && dayjs().isAfter(dayjs(row.ended_at)) ? (
                    (row.ended_actor?.deleted_at ?? null) != null ? (
                      <Link
                        to={`/users/${row.ended_actor?.id ?? ''}`}
                        sx={{textDecoration: 'line-through', color: 'inherit'}}
                        component={RouterLink}>
                        {displayUserName(row.ended_actor)}
                      </Link>
                    ) : (
                      <Link
                        to={`/users/${(row.ended_actor?.email ?? '').toLowerCase()}`}
                        sx={{textDecoration: 'none', color: 'inherit'}}
                        component={RouterLink}>
                        {displayUserName(row.ended_actor)}
                      </Link>
                    )
                  ) : (
                    ''
                  )}
                </TableCell>
                <TableCell>
                  {row.created_reason ? <CreatedReason created_reason={row.created_reason} /> : null}
                </TableCell>
              </TableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{height: 33 * emptyRows}}>
                <TableCell colSpan={7} />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                colSpan={7}
                count={totalRows}
                rowsPerPage={rowsPerPage}
                page={page}
                SelectProps={{
                  inputProps: {
                    'aria-label': 'rows per page',
                  },
                  native: true,
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </React.Fragment>
  );
}
